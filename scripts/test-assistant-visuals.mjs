import assert from "node:assert/strict";
import {
  extractAssistantVisualBlocks,
  hasAssistantVisualIntent,
  inferAssistantVisualType,
  normalizeAssistantVisual
} from "../lib/assistant-visuals.js";

assert.equal(hasAssistantVisualIntent("Plot y = x² from −2 to 2"), true);
assert.equal(hasAssistantVisualIntent("Could you draw a free-body diagram?"), true);
assert.equal(hasAssistantVisualIntent("Create an infographic about reaction rates"), true);
assert.equal(hasAssistantVisualIntent("I want an image explaining electrolysis"), true);
assert.equal(hasAssistantVisualIntent("What does this image show?"), false);
assert.equal(hasAssistantVisualIntent("Explain what the graph shows in this image"), false);
assert.equal(hasAssistantVisualIntent("Explain the graph of velocity versus time"), false);
assert.equal(hasAssistantVisualIntent("Explain the mechanism and draw a diagram"), true);
assert.equal(inferAssistantVisualType("Graph the measured data"), "graph");
assert.equal(inferAssistantVisualType("Generate an informative image about electrolysis"), "infographic");

const output = [
  "The curve passes through the origin.",
  "```apex-visual",
  JSON.stringify({ type: "graph", title: "Linear relation", xLabel: "time (s)", yLabel: "distance (m)", series: [{ label: "d = 2t", points: [[0, 0], [1, 2], [2, 4]] }] }),
  "```",
  "The slope is constant."
].join("\n\n");
const blocks = extractAssistantVisualBlocks(output);
assert.deepEqual(blocks.map((block) => block.type), ["text", "visual", "text"]);
assert.equal(blocks[1].data.title, "Linear relation");

const graph = normalizeAssistantVisual(blocks[1].data);
assert.equal(graph.type, "graph");
assert.equal(graph.xLabel, "time (s)");
assert.equal(graph.series[0].points.length, 3);
assert.equal(graph.series[0].style, "line");
assert.ok(graph.xMin < 0 && graph.xMax > 2);
const brokenCurve = normalizeAssistantVisual({ type: "graph", series: [{ segments: [[[0, 0], [1, 1]], [[2, 1], [3, 0]]] }] });
assert.equal(brokenCurve.series[0].points[2].breakBefore, true);
assert.equal(normalizeAssistantVisual({ type: "graph", series: [{ points: [[0, 0], ["bad", 1]] }] }), null);

const diagram = normalizeAssistantVisual({
  type: "diagram",
  nodes: [{ id: "start", label: "Start", x: -50, y: 50, kind: "start" }, { id: "finish", label: "Finish", x: 120, y: 50 }],
  edges: [{ from: "start", to: "finish", label: "next" }, { from: "missing", to: "finish" }]
});
assert.equal(diagram.nodes[0].x, 0);
assert.equal(diagram.nodes[1].x, 100);
assert.equal(diagram.edges.length, 1);

const infographic = normalizeAssistantVisual({ type: "infographic", items: [{ title: "Key idea", text: "Short explanation" }] });
assert.equal(infographic.cards.length, 1);
assert.equal(infographic.cards[0].heading, "Key idea");
assert.equal(normalizeAssistantVisual({ type: "unknown" }), null);

console.log("Assistant visual intent, parsing, and schema checks passed.");
