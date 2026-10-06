import React, { useId, useRef } from "react";
import { normalizeAssistantVisual } from "./lib/assistant-visuals.js";

const h = React.createElement;
const SVG_TEXT = "var(--text-primary, #172b20)";
const SVG_MUTED = "var(--text-muted, #5b6b62)";
const SVG_STROKE = "var(--stroke, #d7e0e6)";
const SVG_SURFACE = "var(--surface, #ffffff)";
const ACCENTS = {
  blue: { fill: "#edf4ff", stroke: "#7aa7f7", text: "#183f77", solid: "#3478e5" },
  teal: { fill: "#e9faf6", stroke: "#65c7b4", text: "#155d51", solid: "#1e9c87" },
  violet: { fill: "#f2edff", stroke: "#a590f3", text: "#493b81", solid: "#7658db" },
  amber: { fill: "#fff7e6", stroke: "#efbd60", text: "#735112", solid: "#cc8b15" },
  rose: { fill: "#fff0f2", stroke: "#ec9da8", text: "#7c3541", solid: "#d45b6e" },
  green: { fill: "#edf8e8", stroke: "#8dbd76", text: "#355d27", solid: "#57963c" }
};

function safeLines(text, maxCharacters, maxLines = 3) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!words.length) return [""];
  const lines = [];
  let line = "";
  for (const word of words) {
    const chunks = word.length > maxCharacters ? word.match(new RegExp(`.{1,${maxCharacters}}`, "g")) || [word] : [word];
    for (const chunk of chunks) {
      const next = line ? `${line} ${chunk}` : chunk;
      if (next.length > maxCharacters && line) {
        lines.push(line);
        line = chunk;
      } else line = next;
      if (lines.length === maxLines) break;
    }
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  const consumed = lines.join(" ").length;
  const original = words.join(" ");
  if (consumed < original.length && lines.length) lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.…]+$/, "")}…`;
  return lines.slice(0, maxLines);
}

function axisTicks(min, max, divisions = 5) {
  return Array.from({ length: divisions + 1 }, (_, index) => min + (max - min) * index / divisions);
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "";
  const abs = Math.abs(value);
  if ((abs > 0 && abs < 0.001) || abs >= 100000) return value.toExponential(1).replace("e+", "e");
  return Number(value.toPrecision(4)).toString();
}

function GraphSvg({ visual, svgRef, id, ariaLabel }) {
  const width = 760;
  const height = 470;
  const left = 78;
  const right = 28;
  const top = 72;
  const bottom = 82;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const x = (value) => left + (value - visual.xMin) / (visual.xMax - visual.xMin) * plotWidth;
  const y = (value) => top + (visual.yMax - value) / (visual.yMax - visual.yMin) * plotHeight;
  const xTicks = axisTicks(visual.xMin, visual.xMax);
  const yTicks = axisTicks(visual.yMin, visual.yMax);
  const xAxis = visual.yMin <= 0 && visual.yMax >= 0 ? y(0) : top + plotHeight;
  const yAxis = visual.xMin <= 0 && visual.xMax >= 0 ? x(0) : left;
  const clipId = `${id}-graph-clip`;
  const children = [
    h("title", { key: "title" }, visual.title),
    h("desc", { key: "desc" }, ariaLabel),
    h("defs", { key: "defs" }, h("clipPath", { id: clipId }, h("rect", { x: left, y: top, width: plotWidth, height: plotHeight }))),
    h("text", { key: "visible-title", x: width / 2, y: 24, textAnchor: "middle", fill: SVG_TEXT, fontSize: 16, fontWeight: 750 }, safeLines(visual.title, 64, 1)[0])
  ];

  yTicks.forEach((tick, index) => {
    const position = y(tick);
    children.push(h("line", { key: `y-grid-${index}`, x1: left, y1: position, x2: left + plotWidth, y2: position, stroke: SVG_STROKE, strokeWidth: 1, strokeDasharray: "3 5" }));
    children.push(h("text", { key: `y-label-${index}`, x: left - 12, y: position + 4, textAnchor: "end", fill: SVG_MUTED, fontSize: 12 }, formatNumber(tick)));
  });
  xTicks.forEach((tick, index) => {
    const position = x(tick);
    children.push(h("line", { key: `x-grid-${index}`, x1: position, y1: top, x2: position, y2: top + plotHeight, stroke: SVG_STROKE, strokeWidth: 1, strokeDasharray: "3 5" }));
    children.push(h("text", { key: `x-label-${index}`, x: position, y: top + plotHeight + 22, textAnchor: "middle", fill: SVG_MUTED, fontSize: 12 }, formatNumber(tick)));
  });
  children.push(h("line", { key: "x-axis", x1: left, y1: xAxis, x2: left + plotWidth, y2: xAxis, stroke: SVG_TEXT, strokeOpacity: 0.72, strokeWidth: 1.5 }));
  children.push(h("line", { key: "y-axis", x1: yAxis, y1: top, x2: yAxis, y2: top + plotHeight, stroke: SVG_TEXT, strokeOpacity: 0.72, strokeWidth: 1.5 }));

  const barSeries = visual.series.map((series, index) => series.style === "bar" ? index : -1).filter((index) => index >= 0);
  const uniqueX = [...new Set(visual.series.flatMap((series) => series.points.map((point) => point.x)))].sort((a, b) => a - b).map(x);
  const smallestStep = uniqueX.length > 1 ? Math.min(...uniqueX.slice(1).map((value, index) => value - uniqueX[index])) : plotWidth / 8;
  const barWidth = Math.max(5, Math.min(48, smallestStep * 0.74 / Math.max(1, barSeries.length)));
  const barBase = visual.yMin <= 0 && visual.yMax >= 0 ? 0 : visual.yMin;
  children.push(h("g", { key: "series", clipPath: `url(#${clipId})` }, visual.series.map((series, index) => {
    const color = ACCENTS[series.color]?.solid || ACCENTS.blue.solid;
    if (series.style === "bar") {
      const groupIndex = barSeries.indexOf(index);
      return h("g", { key: `series-${index}` }, series.points.map((point, pointIndex) => {
        const center = x(point.x) + (groupIndex - (barSeries.length - 1) / 2) * barWidth;
        const valueY = y(point.y);
        const baseY = y(barBase);
        return h("rect", { key: `bar-${pointIndex}`, x: center - barWidth / 2, y: Math.min(valueY, baseY), width: barWidth, height: Math.max(1, Math.abs(baseY - valueY)), rx: 2, fill: color, fillOpacity: 0.82 });
      }));
    }
    if (series.style === "scatter") {
      return h("g", { key: `series-${index}` }, series.points.map((point, pointIndex) => h("circle", { key: `point-${pointIndex}`, cx: x(point.x), cy: y(point.y), r: 4, fill: color, fillOpacity: 0.82, stroke: SVG_SURFACE, strokeWidth: 1.5 })));
    }
    const path = series.points.map((point, pointIndex) => `${pointIndex && !point.breakBefore ? "L" : "M"}${x(point.x).toFixed(2)},${y(point.y).toFixed(2)}`).join(" ");
    return h("g", { key: `series-${index}` },
      h("path", { d: path, fill: "none", stroke: color, strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round", vectorEffect: "non-scaling-stroke" }),
      series.points.length <= 14 && series.points.map((point, pointIndex) => h("circle", { key: `point-${pointIndex}`, cx: x(point.x), cy: y(point.y), r: 3.5, fill: SVG_SURFACE, stroke: color, strokeWidth: 2 }))
    );
  })));

  visual.annotations.forEach((annotation, index) => {
    const px = x(annotation.x);
    const py = y(annotation.y);
    children.push(h("g", { key: `annotation-${index}` },
      h("circle", { cx: px, cy: py, r: 5, fill: ACCENTS.rose.solid, stroke: SVG_SURFACE, strokeWidth: 2 }),
      h("text", { x: px + 9, y: py - 9, fill: SVG_TEXT, fontSize: 12, fontWeight: 700 }, annotation.label)
    ));
  });

  visual.series.forEach((series, index) => {
    const legendX = left + index * Math.min(136, plotWidth / Math.max(1, visual.series.length));
    const color = ACCENTS[series.color]?.solid || ACCENTS.blue.solid;
    const marker = series.style === "bar"
      ? h("rect", { x: legendX + 3, y: 43, width: 14, height: 12, rx: 2, fill: color })
      : series.style === "scatter"
        ? h("circle", { cx: legendX + 10, cy: 49, r: 5, fill: color })
        : h("line", { x1: legendX, y1: 49, x2: legendX + 21, y2: 49, stroke: color, strokeWidth: 3, strokeLinecap: "round" });
    children.push(h("g", { key: `legend-${index}` },
      marker,
      h("text", { x: legendX + 28, y: 53, fill: SVG_TEXT, fontSize: 12, fontWeight: 600 }, safeLines(series.label, 15, 1)[0])
    ));
  });
  children.push(h("text", { key: "x-axis-label", x: left + plotWidth / 2, y: height - 20, textAnchor: "middle", fill: SVG_TEXT, fontSize: 14, fontWeight: 650 }, visual.xLabel));
  children.push(h("text", { key: "y-axis-label", x: 22, y: top + plotHeight / 2, transform: `rotate(-90 22 ${top + plotHeight / 2})`, textAnchor: "middle", fill: SVG_TEXT, fontSize: 14, fontWeight: 650 }, visual.yLabel));

  return h("svg", { ref: svgRef, className: "assistant-visual-svg", xmlns: "http://www.w3.org/2000/svg", viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": ariaLabel, preserveAspectRatio: "xMidYMid meet" }, children);
}

function edgeEndpoints(from, to, nodeWidth, nodeHeight) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (!dx && !dy) return { x1: from.x, y1: from.y, x2: to.x, y2: to.y, mx: from.x, my: from.y };
  const fromScale = Math.min((nodeWidth / 2) / Math.max(1e-8, Math.abs(dx)), (nodeHeight / 2) / Math.max(1e-8, Math.abs(dy)));
  const toScale = Math.min((nodeWidth / 2) / Math.max(1e-8, Math.abs(dx)), (nodeHeight / 2) / Math.max(1e-8, Math.abs(dy)));
  const x1 = from.x + dx * fromScale;
  const y1 = from.y + dy * fromScale;
  const x2 = to.x - dx * toScale;
  const y2 = to.y - dy * toScale;
  return { x1, y1, x2, y2, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
}

function DiagramSvg({ visual, svgRef, id, ariaLabel }) {
  const width = 760;
  const height = 470;
  const left = 72;
  const right = 72;
  const top = 68;
  const bottom = 42;
  const nodeWidth = visual.nodes.length > 8 ? 128 : 148;
  const nodeHeight = 72;
  const pointById = new Map(visual.nodes.map((node) => [node.id, {
    ...node,
    cx: left + node.x / 100 * (width - left - right),
    cy: top + node.y / 100 * (height - top - bottom)
  }]));
  const children = [
    h("title", { key: "title" }, visual.title),
    h("desc", { key: "desc" }, ariaLabel),
    h("defs", { key: "defs" }, h("marker", { id: `${id}-arrow`, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse", markerUnits: "strokeWidth" }, h("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#748398" }))),
    h("text", { key: "visible-title", x: width / 2, y: 30, textAnchor: "middle", fill: SVG_TEXT, fontSize: 16, fontWeight: 750 }, safeLines(visual.title, 64, 1)[0])
  ];

  visual.edges.forEach((edge, index) => {
    const from = pointById.get(edge.from);
    const to = pointById.get(edge.to);
    if (!from || !to) return;
    const line = edgeEndpoints(from, to, nodeWidth, nodeHeight);
    children.push(h("g", { key: `edge-${index}` },
      h("line", { x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, stroke: "#748398", strokeWidth: 2, strokeDasharray: edge.kind === "dashed" ? "6 5" : undefined, markerEnd: edge.directed ? `url(#${id}-arrow)` : undefined }),
      edge.label && h("g", null,
        h("rect", { x: line.mx - Math.max(24, edge.label.length * 3.4 + 8), y: line.my - 21, width: Math.max(48, edge.label.length * 6.8 + 16), height: 20, rx: 7, fill: SVG_SURFACE, stroke: SVG_STROKE, strokeWidth: 1 }),
        h("text", { x: line.mx, y: line.my - 7, textAnchor: "middle", fill: SVG_MUTED, fontSize: 10, fontWeight: 600 }, edge.label)
      )
    ));
  });

  visual.nodes.forEach((node) => {
    const point = pointById.get(node.id);
    const color = ACCENTS[node.accent] || ACCENTS.blue;
    const labelLines = safeLines(node.label, visual.nodes.length > 8 ? 18 : 21, node.detail ? 2 : 3);
    const detailLines = node.detail ? safeLines(node.detail, 23, 2) : [];
    const totalLines = labelLines.length + detailLines.length;
    const startY = point.cy - ((totalLines - 1) * 8);
    let shape;
    if (node.kind === "decision") {
      const halfWidth = nodeWidth / 2;
      const halfHeight = nodeHeight / 2;
      shape = h("polygon", { points: `${point.cx},${point.cy - halfHeight} ${point.cx + halfWidth},${point.cy} ${point.cx},${point.cy + halfHeight} ${point.cx - halfWidth},${point.cy}`, fill: color.fill, stroke: color.stroke, strokeWidth: 2 });
    } else {
      shape = h("rect", { x: point.cx - nodeWidth / 2, y: point.cy - nodeHeight / 2, width: nodeWidth, height: nodeHeight, rx: node.kind === "start" || node.kind === "end" || node.kind === "terminal" ? 34 : 13, fill: color.fill, stroke: color.stroke, strokeWidth: 2 });
    }
    const text = [];
    labelLines.forEach((line, index) => text.push(h("tspan", { key: `label-${index}`, x: point.cx, dy: index === 0 ? 0 : 16 }, line)));
    detailLines.forEach((line, index) => text.push(h("tspan", { key: `detail-${index}`, x: point.cx, dy: index === 0 ? 15 : 13, fill: color.text, fontSize: 9, fontWeight: 500 }, line)));
    children.push(h("g", { key: `node-${node.id}` }, shape,
      h("text", { x: point.cx, y: startY, textAnchor: "middle", fill: color.text, fontSize: 12, fontWeight: 700 }, text)
    ));
  });

  return h("svg", { ref: svgRef, className: "assistant-visual-svg", xmlns: "http://www.w3.org/2000/svg", viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": ariaLabel, preserveAspectRatio: "xMidYMid meet" }, children);
}

function InfographicSvg({ visual, svgRef, ariaLabel }) {
  const width = 760;
  const padding = 26;
  const gap = 16;
  const columns = visual.cards.length === 1 ? 1 : 2;
  const cardWidth = (width - padding * 2 - gap * (columns - 1)) / columns;
  const cardHeight = 126;
  const rowGap = 14;
  const top = 72;
  const rows = Math.ceil(visual.cards.length / columns);
  const height = top + rows * cardHeight + Math.max(0, rows - 1) * rowGap + 28;
  const children = [
    h("title", { key: "title" }, visual.title),
    h("desc", { key: "desc" }, ariaLabel),
    h("text", { key: "visible-title", x: padding, y: 27, fill: SVG_TEXT, fontSize: 16, fontWeight: 750 }, safeLines(visual.title, 72, 1)[0]),
    visual.subtitle && h("text", { key: "visible-subtitle", x: padding, y: 50, fill: SVG_MUTED, fontSize: 11 }, safeLines(visual.subtitle, 100, 1)[0])
  ];

  visual.cards.forEach((card, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const x = padding + column * (cardWidth + gap);
    const y = top + row * (cardHeight + rowGap);
    const accent = ACCENTS[card.accent] || ACCENTS.blue;
    const heading = safeLines(card.heading, columns === 1 ? 46 : 34, 2);
    const body = safeLines(card.body, columns === 1 ? 92 : 53, 4);
    const headingY = y + (heading.length === 1 ? 41 : 33);
    const bodyY = y + (heading.length === 1 ? 72 : 61);
    const cardChildren = [
      h("rect", { key: "background", x, y, width: cardWidth, height: cardHeight, rx: 14, fill: SVG_SURFACE, stroke: SVG_STROKE, strokeWidth: 1.4 }),
      h("rect", { key: "accent-bar", x, y, width: 5, height: cardHeight, rx: 2.5, fill: accent.solid }),
      h("circle", { key: "badge", cx: x + 27, cy: y + 30, r: 12, fill: accent.solid }),
      h("text", { key: "number", x: x + 27, y: y + 34, textAnchor: "middle", fill: "#ffffff", fontSize: 10, fontWeight: 800 }, String(index + 1))
    ];
    cardChildren.push(h("text", { key: "heading", x: x + 48, y: headingY, fill: accent.text, fontSize: 13, fontWeight: 750 }, heading.map((line, lineIndex) => h("tspan", { key: lineIndex, x: x + 48, dy: lineIndex === 0 ? 0 : 16 }, line))));
    if (body[0]) cardChildren.push(h("text", { key: "body", x: x + 18, y: bodyY, fill: SVG_MUTED, fontSize: 11.5, fontWeight: 450 }, body.map((line, lineIndex) => h("tspan", { key: lineIndex, x: x + 18, dy: lineIndex === 0 ? 0 : 15 }, line))));
    children.push(h("g", { key: `card-${index}` }, cardChildren));
  });

  if (visual.footer) children.push(h("text", { key: "footer", x: width / 2, y: height - 8, textAnchor: "middle", fill: SVG_MUTED, fontSize: 10 }, visual.footer));
  return h("svg", { ref: svgRef, className: "assistant-visual-svg", xmlns: "http://www.w3.org/2000/svg", viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": ariaLabel, preserveAspectRatio: "xMidYMid meet" }, children);
}

function filenameFor(title) {
  return String(title || "apex-study-visual").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "apex-study-visual";
}

export default function AssistantVisual({ data }) {
  const svgRef = useRef(null);
  const reactId = useId();
  const id = reactId.replace(/[^a-zA-Z0-9_-]/g, "") || "apex-visual";
  const visual = normalizeAssistantVisual(data);
  const title = visual?.title || "Study visual";
  const ariaLabel = [visual?.title, visual?.description].filter(Boolean).join(". ") || title;

  const downloadSvg = () => {
    const svg = svgRef.current;
    if (!svg || typeof document === "undefined" || typeof XMLSerializer === "undefined") return;
    const copy = svg.cloneNode(true);
    copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const [, , width, height] = String(copy.getAttribute("viewBox") || "0 0 760 470").split(/\s+/);
    copy.setAttribute("width", width || "760");
    copy.setAttribute("height", height || "470");
    const blob = new Blob([new XMLSerializer().serializeToString(copy)], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filenameFor(title)}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (!visual) {
    return h("figure", { className: "assistant-generated-visual has-error" },
      h("div", { className: "assistant-visual-toolbar" }, h("strong", null, "Visual could not be rendered")),
      h("div", { className: "assistant-visual-error", role: "status" }, "I couldn't turn the visual data into a diagram. Please ask me to redraw it with a graph, diagram, or infographic.")
    );
  }

  const canvas = visual.type === "graph"
    ? h(GraphSvg, { visual, svgRef, id, ariaLabel })
    : visual.type === "diagram"
      ? h(DiagramSvg, { visual, svgRef, id, ariaLabel })
      : h(InfographicSvg, { visual, svgRef, ariaLabel });

  return h("figure", { className: `assistant-generated-visual assistant-visual-${visual.type}` },
    h("div", { className: "assistant-visual-toolbar" },
      h("div", { className: "assistant-visual-heading" },
        h("strong", null, title),
        h("span", null, visual.type === "graph" ? "Graph" : visual.type === "diagram" ? "Diagram" : "Infographic")
      ),
      h("button", { type: "button", className: "assistant-visual-download", onClick: downloadSvg, "aria-label": `Download ${title} as an SVG image` }, "Save SVG")
    ),
    visual.subtitle && h("p", { className: "assistant-visual-subtitle" }, visual.subtitle),
    h("div", { className: "assistant-visual-stage" }, canvas),
    (visual.description || visual.type === "graph" && `${visual.xLabel} vs ${visual.yLabel}`) && h("figcaption", null, visual.description || `${visual.xLabel} vs ${visual.yLabel}`)
  );
}
