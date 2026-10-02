import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useLayoutEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { normalizeMathMarkup } from "./recall-math.js";

function convertLegacyRadicals(value) {
  let output = "";
  for (let index = 0; index < value.length; index += 1) {
    const opening = value[index + 1];
    if (value[index] !== "√" || (opening !== "(" && opening !== "[")) {
      output += value[index];
      continue;
    }
    const closing = opening === "(" ? ")" : "]";
    let depth = 1;
    let end = index + 2;
    for (; end < value.length && depth; end += 1) {
      if (value[end] === opening) depth += 1;
      else if (value[end] === closing) depth -= 1;
    }
    if (depth) {
      output += value[index];
      continue;
    }
    const radicand = value.slice(index + 2, end - 1).trim();
    let nesting = 0;
    const divisions = [];
    for (let cursor = 0; cursor < radicand.length; cursor += 1) {
      if (radicand[cursor] === "(" || radicand[cursor] === "[") nesting += 1;
      else if (radicand[cursor] === ")" || radicand[cursor] === "]") nesting -= 1;
      else if (radicand[cursor] === "/" && nesting === 0) divisions.push(cursor);
    }
    let body = radicand;
    if (divisions.length === 1) {
      const division = divisions[0];
      body = `\\frac{${radicand.slice(0, division).trim()}}{${radicand.slice(division + 1).trim()}}`;
    }
    output += `$\\sqrt{${body}}$`;
    index = end - 1;
  }
  return output;
}
function repairLegacyMath(value) {
  let normalized = normalizeMathMarkup(value);

  // Older recall decks contain formula-only answers without any delimiters.
  // Wrap these as math while leaving ordinary prose alone.
  const bareMath = (candidate) => {
    const trimmed = candidate.trim();
    if (/^\\[A-Za-z]+/.test(trimmed) || /^\{\s*\}\s*[\^_]/.test(trimmed)) return true;
    if (!trimmed || !/[\\^_{}=+*/]/.test(trimmed)) return false;
    if (/─{2,}>|:/.test(trimmed)) return false;
    const plainWords = trimmed.replace(/\\[A-Za-z]+/g, " ").match(/[A-Za-z]{2,}/g) || [];
    const proseWords = new Set(["and", "are", "but", "correct", "does", "for", "from", "given", "here", "if", "incorrect", "into", "is", "not", "of", "or", "the", "then", "this", "to", "was", "when", "where", "with"]);
    return !plainWords.some((word) => proseWords.has(word.toLowerCase()));
  };
  if (!normalized.includes("$") && bareMath(normalized)) {
    normalized = `$${normalized.trim()}$`;
  }

  // A few legacy answers omitted the opening dollar before their first bare
  // fraction, leaving the following prose and formula delimiters unbalanced.
  const dollarCount = (normalized.match(/\$/g) || []).length;
  const firstDollar = normalized.indexOf("$");
  if (dollarCount % 2 === 1 && firstDollar > 0 && bareMath(normalized.slice(0, firstDollar))) {
    normalized = `$${normalized}`;
  }

  return normalized.split(/(```[\s\S]*?```|`[^`]*`|\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g).map((part) => {
    if (part.startsWith("`") || part.startsWith("$") || part.startsWith("\\(")) return part;
    // Legacy decks sometimes contain a Unicode radical and a plain-text
    // fraction. Convert the complete radicand to KaTeX so the vinculum spans
    // the expression and the fraction gets its own vertical space.
    let repaired = convertLegacyRadicals(part);
    const transformOutsideMath = (text, transform) => text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g).map((segment) => segment.startsWith("$") ? segment : transform(segment)).join("");
    // These legacy repairs must only touch prose. Running them inside formulas
    // can nest dollar delimiters or split a fraction's arguments.
    repaired = transformOutsideMath(repaired, (text) => text.replace(/\(([^()\n]+)\)\s*\/\s*\(([^()\n]+)\)/g, (_, numerator, denominator) => `$\\frac{${numerator.trim()}}{${denominator.trim()}}$`));
    repaired = transformOutsideMath(repaired, (text) => text.replace(/\b([A-Za-z][A-Za-z0-9']*)\^\(([^()\n]+)\)/g, (_, base, power) => `$${base}^{${power.trim()}}$`));
    repaired = transformOutsideMath(repaired, (text) => text.replace(/\b([A-Za-z][A-Za-z0-9']*)_\(([^()\n]+)\)/g, (_, base, index) => `$${base}_{${index.trim()}}$`));
    repaired = transformOutsideMath(repaired, (text) => text.replace(/\b([A-Za-z][A-Za-z0-9']*)_\{([^{}\n]+)\}/g, (_, base, index) => `$${base}_{${index}}$`));
    repaired = transformOutsideMath(repaired, (text) => text.replace(/\b([A-Za-z][A-Za-z0-9']*)_([A-Za-z0-9]+)/g, (_, base, index) => `$${base}_{${index}}$`));
    repaired = transformOutsideMath(repaired, (text) => text.replace(/\b([A-Za-z][A-Za-z0-9']*)\^\{([^{}\n]+)\}/g, (_, base, power) => `$${base}^{${power}}$`));
    return transformOutsideMath(repaired, (text) => text.replace(/\b([A-Za-z][A-Za-z0-9']*)\^([A-Za-z0-9+-]+)/g, (_, base, power) => `$${base}^{${power}}$`));
  }).join("");
}
function MathText({ children, className = "", legacy = false, components = {} }) {
  const text = String(children ?? "");
  const source = legacy ? repairLegacyMath(text) : normalizeMathMarkup(text);
  const renderRootRef = useRef(null);
  useLayoutEffect(() => {
    const root = renderRootRef.current;
    if (!root) return void 0;
    const observed = new WeakSet();
    const measure = () => {
      root.querySelectorAll(".katex-display, .katex").forEach((node) => {
        const overflowing = node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 2;
        node.dataset.overflowing = String(overflowing);
      });
    };
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    const observeMath = () => {
      if (!resizeObserver) return;
      root.querySelectorAll(".katex-display, .katex").forEach((node) => {
        if (observed.has(node)) return;
        observed.add(node);
        resizeObserver.observe(node);
      });
    };
    observeMath();
    resizeObserver?.observe(root);
    measure();
    const mutationObserver = typeof MutationObserver === "undefined" ? null : new MutationObserver(() => {
      observeMath();
      measure();
    });
    mutationObserver?.observe(root, { childList: true, subtree: true });
    window.addEventListener("resize", measure);
    document.fonts?.ready?.then(measure);
    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [source]);
  const markdown = React.createElement(ReactMarkdown, {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [[rehypeKatex, { throwOnError: false, strict: "warn" }]],
    components: {
      table: ({ children: tableChildren, ...props }) => /* @__PURE__ */ jsxDEV("div", {
        className: "math-table-scroll",
        children: /* @__PURE__ */ jsxDEV("table", { ...props, children: tableChildren }, void 0, false, { fileName: "math-markdown.js", lineNumber: 38, columnNumber: 17 }, this)
      }, void 0, false, { fileName: "math-markdown.js", lineNumber: 37, columnNumber: 7 }, this),
      ...components
    },
    children: source
  });
  return React.createElement("div", { ref: renderRootRef, className: `math-render-root ${className}`.trim() }, markdown);
}

const MemoizedMathText = React.memo(MathText);
export {
  MemoizedMathText as default,
  MemoizedMathText as MathText
};
