const VISUAL_TERMS = /\b(?:graphs?|plots?|charts?|diagrams?|schematics?|flowcharts?|mind\s*maps?|infographics?|timelines?|illustrations?|visuals?|images?|pictures?|structures?|illustrat\w*|visuali[sz]e\w*)\b/i;
const GRAPH_TERMS = /\b(?:graphs?|plots?|charts?|curves?|waveforms?)\b/i;
const INFOGRAPHIC_TERMS = /\b(?:infographics?|mind\s*maps?|posters?|visual\s+summar(?:y|ies)|one[- ]page\s+summar(?:y|ies))\b/i;
const CREATE_TERMS = /\b(?:draw|generate|create|make|plot|sketch|illustrate|visuali[sz]e|render|design|produce|build)\b/i;
const PALETTE = ["blue", "teal", "violet", "amber", "rose", "green"];
const MAX_COORDINATE = 1e9;

function cleanText(value, maxLength = 180) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, maxLength);
}

function finiteNumber(value) {
  if (typeof value === "string" && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= MAX_COORDINATE ? number : null;
}

function safeId(value, fallback) {
  const id = cleanText(String(value ?? ""), 56).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return id || fallback;
}

function parseVisualJson(raw) {
  const source = String(raw || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(source);
  } catch {
    const start = source.indexOf("{");
    const end = source.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(source.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

/** Return true only when the user is asking the assistant to make a visual. */
export function hasAssistantVisualIntent(prompt = "") {
  const text = String(prompt || "").trim();
  if (!text || !VISUAL_TERMS.test(text)) return false;

  const isAnalysisQuestion = /\b(?:analy[sz]e|describe|identify|read|inspect|explain|interpret)\b/i.test(text);
  const explicitVisualAction = /\b(?:draw|generate|plot|sketch|illustrate|visuali[sz]e|render|design|produce|build)\b/i.test(text);
  const creationRequest = CREATE_TERMS.test(text) && VISUAL_TERMS.test(text) && (!isAnalysisQuestion || explicitVisualAction);
  const showRequest = /\b(?:show|give|provide)\s+(?:me\s+)?(?:(?:a|an|the|some)\s+)?(?:graph|plot|chart|diagram|schematic|flowchart|mind\s*map|infographic|timeline|illustration|visual|image|picture)\b/i.test(text);
  const directRequest = /^\s*(?:please\s+)?(?:(?:can|could|would)\s+you\s+)?(?:(?:a|an|the)\s+)?(?:graph|plot|chart|diagram|schematic|flowchart|mind\s*map|infographic|timeline|structure)\b/i.test(text);
  const desireRequest = /\b(?:i|we)\s+(?:want|need|would like)\s+(?:(?:you to\s+)?(?:draw|create|make|generate|plot|show|provide)\s+)?(?:to see\s+)?(?:me\s+)?(?:(?:a|an|the)\s+)?(?:graph|plot|chart|diagram|schematic|flowchart|mind\s*map|infographic|timeline|illustration|visual|image|picture)\b/i.test(text);
  const visualConstruction = !isAnalysisQuestion && /\b(?:graph|plot|chart|diagram|schematic|flowchart|mind\s*map|infographic|timeline|illustration)\s+(?:of|for|showing|to explain|that shows|based on)\b/i.test(text);
  const conversionRequest = !isAnalysisQuestion && /\b(?:turn|convert|redraw|recreate|trace)\b[\s\S]{0,60}\b(?:into|as|like|from)\b[\s\S]{0,60}\b(?:graph|plot|diagram|flowchart|infographic|illustration|visual|image|picture)\b/i.test(text);
  return creationRequest || showRequest || directRequest || desireRequest || visualConstruction || conversionRequest;
}

export function inferAssistantVisualType(prompt = "") {
  const text = String(prompt || "");
  if (GRAPH_TERMS.test(text)) return "graph";
  if (INFOGRAPHIC_TERMS.test(text) || /\b(?:images?|pictures?|posters?)\b/i.test(text) && !/\b(?:diagram|schematic|flowchart)\b/i.test(text)) return "infographic";
  return "diagram";
}

/** Split model output into Markdown and structured, locally-rendered visual blocks. */
export function extractAssistantVisualBlocks(content = "") {
  const source = String(content || "");
  const pattern = /```(?:apex-visual|apex_visual|visual-json)\b[^\S\r\n]*\r?\n?([\s\S]*?)```/gi;
  const blocks = [];
  let cursor = 0;
  let match;
  while ((match = pattern.exec(source))) {
    if (match.index > cursor) blocks.push({ type: "text", text: source.slice(cursor, match.index) });
    const raw = match[1].trim();
    blocks.push({ type: "visual", raw, data: parseVisualJson(raw) });
    cursor = pattern.lastIndex;
  }
  if (cursor < source.length) blocks.push({ type: "text", text: source.slice(cursor) });
  return blocks.length ? blocks : [{ type: "text", text: source }];
}

function graphPoints(series) {
  const source = Array.isArray(series?.segments)
    ? series.segments.slice(0, 8).flatMap((segment, segmentIndex) => (Array.isArray(segment) ? segment : []).map((point, pointIndex) => ({ point, breakBefore: segmentIndex > 0 && pointIndex === 0 }))).slice(0, 80)
    : (Array.isArray(series?.points) ? series.points : Array.isArray(series?.data) ? series.data : []).slice(0, 80).map((point) => ({ point, breakBefore: false }));
  let breakNext = false;
  const points = [];
  for (const entry of source) {
    const point = entry.point;
    if (!point || point?.break === true) {
      breakNext = true;
      continue;
    }
    const x = finiteNumber(Array.isArray(point) ? point[0] : point?.x);
    const y = finiteNumber(Array.isArray(point) ? point[1] : point?.y);
    if (x === null || y === null) {
      breakNext = true;
      continue;
    }
    points.push({ x, y, breakBefore: Boolean(entry.breakBefore || point?.breakBefore || breakNext) });
    breakNext = false;
  }
  return points;
}

function resolveDomain(minValue, maxValue, domain, values) {
  const minimum = finiteNumber(minValue) ?? finiteNumber(domain?.[0]);
  const maximum = finiteNumber(maxValue) ?? finiteNumber(domain?.[1]);
  let low = minimum ?? Math.min(...values);
  let high = maximum ?? Math.max(...values);
  if (low > high) [low, high] = [high, low];
  if (low === high) {
    const padding = Math.abs(low) * 0.08 || 1;
    low -= padding;
    high += padding;
  } else {
    const padding = (high - low) * 0.04;
    if (minimum === null) low -= padding;
    if (maximum === null) high += padding;
  }
  return [low, high];
}

function normalizeGraph(value, common) {
  const series = (Array.isArray(value.series) ? value.series : []).slice(0, 5).map((entry, index) => ({
    label: cleanText(entry?.label || entry?.name || `Series ${index + 1}`, 72),
    points: graphPoints(entry),
    style: ["line", "scatter", "bar"].includes(String(entry?.style || entry?.type || "").toLowerCase()) ? String(entry.style || entry.type).toLowerCase() : "line",
    color: PALETTE[index % PALETTE.length]
  })).filter((entry) => entry.points.length >= 2);
  if (!series.length) return null;

  const allPoints = series.flatMap((entry) => entry.points);
  const [xMin, xMax] = resolveDomain(value.xMin, value.xMax, value.xDomain, allPoints.map((point) => point.x));
  const [yMin, yMax] = resolveDomain(value.yMin, value.yMax, value.yDomain, allPoints.map((point) => point.y));
  const annotations = (Array.isArray(value.annotations) ? value.annotations : []).slice(0, 8).map((item) => ({
    x: finiteNumber(item?.x),
    y: finiteNumber(item?.y),
    label: cleanText(item?.label, 64)
  })).filter((item) => item.x !== null && item.y !== null && item.label);

  return {
    ...common,
    type: "graph",
    xLabel: cleanText(value.xLabel || value.xAxis || "x", 56),
    yLabel: cleanText(value.yLabel || value.yAxis || "y", 56),
    xMin,
    xMax,
    yMin,
    yMax,
    series,
    annotations
  };
}

function autoPosition(index, total) {
  if (total <= 1) return { x: 50, y: 50 };
  if (total === 2) return { x: index === 0 ? 28 : 72, y: 50 };
  if (total === 3) return { x: 16 + index * 34, y: 50 };
  const columns = Math.min(4, Math.ceil(Math.sqrt(total)));
  const rows = Math.ceil(total / columns);
  return {
    x: 12 + (index % columns) * (76 / Math.max(1, columns - 1)),
    y: 16 + Math.floor(index / columns) * (68 / Math.max(1, rows - 1))
  };
}

function normalizeDiagram(value, common) {
  const rawNodes = Array.isArray(value.nodes) ? value.nodes : [];
  const rawSteps = Array.isArray(value.steps) ? value.steps : [];
  const sourceNodes = (rawNodes.length ? rawNodes : rawSteps).slice(0, 14);
  if (!sourceNodes.length) return null;
  const idMap = new Map();
  const usedIds = new Set();
  const nodes = sourceNodes.map((entry, index) => {
    const originalId = String(entry?.id ?? entry?.key ?? `node-${index + 1}`);
    let id = safeId(originalId, `node-${index + 1}`);
    while (usedIds.has(id)) id = `${id}-${index + 1}`;
    usedIds.add(id);
    idMap.set(originalId, id);
    idMap.set(id, id);
    const fallback = autoPosition(index, sourceNodes.length);
    const x = finiteNumber(entry?.x);
    const y = finiteNumber(entry?.y);
    const kind = ["start", "end", "decision", "process", "terminal"].includes(String(entry?.kind || "").toLowerCase()) ? String(entry.kind).toLowerCase() : "process";
    const accent = PALETTE.includes(String(entry?.accent || "").toLowerCase()) ? String(entry.accent).toLowerCase() : PALETTE[index % PALETTE.length];
    return {
      id,
      label: cleanText(entry?.label || entry?.title || entry?.text || `Step ${index + 1}`, 84),
      detail: cleanText(entry?.detail || entry?.description, 100),
      x: x === null ? fallback.x : Math.max(0, Math.min(100, x)),
      y: y === null ? fallback.y : Math.max(0, Math.min(100, y)),
      kind,
      accent
    };
  });
  const ids = new Set(nodes.map((node) => node.id));
  let sourceEdges = Array.isArray(value.edges) ? value.edges : [];
  if (!sourceEdges.length && rawSteps.length && nodes.length > 1) {
    sourceEdges = nodes.slice(0, -1).map((node, index) => ({ from: node.id, to: nodes[index + 1].id, directed: true }));
  }
  const edges = sourceEdges.slice(0, 24).map((edge) => {
    const rawFrom = String(edge?.from ?? edge?.source ?? "");
    const rawTo = String(edge?.to ?? edge?.target ?? "");
    return {
      from: idMap.get(rawFrom) || rawFrom,
      to: idMap.get(rawTo) || rawTo,
      label: cleanText(edge?.label, 48),
      directed: edge?.directed !== false,
      kind: String(edge?.kind || "").toLowerCase() === "dashed" ? "dashed" : "solid"
    };
  }).filter((edge) => ids.has(edge.from) && ids.has(edge.to) && edge.from !== edge.to);

  return { ...common, type: "diagram", nodes, edges };
}

function normalizeInfographic(value, common) {
  const rawCards = Array.isArray(value.cards) ? value.cards : Array.isArray(value.items) ? value.items : Array.isArray(value.sections) ? value.sections : [];
  const cards = rawCards.slice(0, 8).map((card, index) => ({
    heading: cleanText(card?.heading || card?.title || card?.label || `Key idea ${index + 1}`, 76),
    body: cleanText(card?.body || card?.text || card?.description || card?.detail, 340),
    accent: PALETTE.includes(String(card?.accent || "").toLowerCase()) ? String(card.accent).toLowerCase() : PALETTE[index % PALETTE.length]
  })).filter((card) => card.heading || card.body);
  if (!cards.length) return null;
  return { ...common, type: "infographic", subtitle: cleanText(value.subtitle || value.summary, 160), footer: cleanText(value.footer, 120), cards };
}

/** Validate and bound model-provided visual data before it reaches the SVG renderer. */
export function normalizeAssistantVisual(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const rawType = String(value.type || "").toLowerCase();
  const type = rawType === "plot" || rawType === "chart" ? "graph"
    : rawType === "flowchart" || rawType === "timeline" || rawType === "schematic" ? "diagram"
      : rawType === "image" || rawType === "poster" || rawType === "mindmap" || rawType === "mind-map" || rawType === "cards" ? "infographic"
        : rawType;
  if (!["graph", "diagram", "infographic"].includes(type)) return null;
  const common = {
    title: cleanText(value.title || value.heading, 120) || "Study visual",
    description: cleanText(value.description || value.caption || value.alt, 260)
  };
  if (type === "graph") return normalizeGraph(value, common);
  if (type === "diagram") return normalizeDiagram(value, common);
  return normalizeInfographic(value, common);
}
