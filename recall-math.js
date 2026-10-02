export function normalizeMathMarkup(value) {
  let source = String(value ?? "").replace(/\\+n(?!(?:eq|e(?![A-Za-z])|abla|eg|i|ot|mid|u|exists|parallel|rightarrow|Rightarrow|subset|supset|vdash|triangleleft|triangleright))/g, "\n");
  const rowSpacingEscapes = [];
  source = source.replace(/(\\{2,})(?=\[\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)\s*(?:pt|em|ex|mu|mm|cm|in|bp|pc|dd|cc|nd|nc|sp)\])/gi, (_, slashes) => {
    const marker = `\uE000${rowSpacingEscapes.length}\uE001`;
    rowSpacingEscapes.push(slashes);
    return marker;
  });
  source = source.replace(/\\{4,}(?=\s)/g, "\\\\");
  source = source.replace(/\\{2,}(?=[A-Za-z])/g, "\\");
  source = source.replace(/\\{2,}(?=[,{}%_&#$;:!<>()\[\]])/g, "\\");
  source = source
    .replace(/\\{1,}\[([\s\S]*?)\\{1,}\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`)
    .replace(/\\{1,}\(([\s\S]*?)\\{1,}\)/g, (_, math) => `$${math.trim()}$`)
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);
  rowSpacingEscapes.forEach((slashes, index) => {
    source = source.replace(`\uE000${index}\uE001`, slashes);
  });
  return source;
}

export function runRecallMathSelfTest() {
  const encoded = String.raw`{"items":[{"front":"\\\\frac{a}{b} and \\\\sin x","back":"\\\\theta, v_{rms}, x^{2}"}]}`;
  const parsed = JSON.parse(encoded);
  const formula = normalizeMathMarkup(`${parsed.items[0].front} ${parsed.items[0].back}`);
  const checks = {
    doubleEscapedFraction: formula.includes("\\frac{a}{b}"),
    verticalFractionMarkup: formula.includes("\\frac{a}{b}"),
    trigCommand: formula.includes("\\sin x"),
    symbolCommand: formula.includes("\\theta"),
    subscript: formula.includes("v_{rms}"),
    superscript: formula.includes("x^{2}")
  };
  const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
  if (failed.length) throw new Error(`Recall KaTeX self-test failed: ${failed.join(", ")}`);
  return checks;
}
