// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

/**
 * Hand-drawn architecture diagram overlay for the sign-in screen.
 * Renders a chalk-on-dark SVG showing Meridian's data flow:
 *   Documents -> RAG Engine -> Knowledge Base
 *                    |
 *              MCP Server  <-- AI Agents
 *                    |
 *            Governance Gate
 *
 * Uses wobbly SVG paths to simulate hand-drawing. Rendered at low
 * opacity as an atmospheric background element.
 */

// Slight jitter for hand-drawn feel
function jitter(v: number, amount = 1.5): number {
  // Deterministic wobble based on value (no Math.random — SSR-safe)
  return v + Math.sin(v * 7.3) * amount;
}

// Hand-drawn rectangle as a wobbly path
function sketchRect(x: number, y: number, w: number, h: number): string {
  const j = 1.2;
  return [
    `M${jitter(x, j)},${jitter(y, j)}`,
    `L${jitter(x + w, j)},${jitter(y, j)}`,
    `L${jitter(x + w, j)},${jitter(y + h, j)}`,
    `L${jitter(x, j)},${jitter(y + h, j)}`,
    'Z',
  ].join(' ');
}

// Hand-drawn arrow from point A to point B
function sketchArrow(
  x1: number, y1: number, x2: number, y2: number,
): { line: string; head: string } {
  const j = 1;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 8;
  const line = `M${jitter(x1, j)},${jitter(y1, j)} L${jitter(x2, j)},${jitter(y2, j)}`;
  const head = [
    `M${x2},${y2}`,
    `L${x2 - headLen * Math.cos(angle - 0.4)},${y2 - headLen * Math.sin(angle - 0.4)}`,
    `M${x2},${y2}`,
    `L${x2 - headLen * Math.cos(angle + 0.4)},${y2 - headLen * Math.sin(angle + 0.4)}`,
  ].join(' ');
  return { line, head };
}

// Box definitions: label, x, y, w, h
const BOXES = [
  { label: 'Documents', x: 40, y: 55, w: 90, h: 30 },
  { label: 'RAG Engine', x: 185, y: 55, w: 95, h: 30 },
  { label: 'Knowledge Base', x: 335, y: 55, w: 115, h: 30 },
  { label: 'MCP Server', x: 185, y: 130, w: 95, h: 30 },
  { label: 'AI Agents', x: 345, y: 130, w: 85, h: 30 },
  { label: 'Governance', x: 185, y: 200, w: 95, h: 30 },
] as const;

// Arrows: from box center-right to box center-left (or center-bottom to center-top)
const ARROWS = [
  // Documents -> RAG Engine
  { x1: 130, y1: 70, x2: 185, y2: 70 },
  // RAG Engine -> Knowledge Base
  { x1: 280, y1: 70, x2: 335, y2: 70 },
  // RAG Engine -> MCP Server (down)
  { x1: 232, y1: 85, x2: 232, y2: 130 },
  // AI Agents -> MCP Server (left arrow)
  { x1: 345, y1: 145, x2: 280, y2: 145 },
  // MCP Server -> Governance (down)
  { x1: 232, y1: 160, x2: 232, y2: 200 },
] as const;

// Chalk stroke style
const CHALK = {
  stroke: 'rgba(255, 255, 255, 0.55)',
  strokeWidth: 1.2,
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const CHALK_TEXT = {
  fill: 'rgba(255, 255, 255, 0.5)',
  fontSize: 9,
  fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  fontWeight: 400,
  textAnchor: 'middle' as const,
  dominantBaseline: 'central' as const,
};

export function ArchitectureSketch() {
  return (
    <svg
      className="absolute pointer-events-none"
      style={{ bottom: '5%', right: '3%', width: '480px', height: '260px', opacity: 0.14 }}
      viewBox="0 0 480 260"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Underline accent — subtle chalk line across top */}
      <path
        d={`M${jitter(20)},${jitter(30)} L${jitter(460)},${jitter(30)}`}
        {...CHALK}
        strokeWidth={0.4}
        strokeDasharray="3 6"
      />

      {/* Title */}
      <text x={240} y={18} {...CHALK_TEXT} fontSize={11} fontWeight={500} letterSpacing={2}>
        MERIDIAN ARCHITECTURE
      </text>

      {/* Boxes */}
      {BOXES.map(({ label, x, y, w, h }) => (
        <g key={label}>
          <path d={sketchRect(x, y, w, h)} {...CHALK} />
          <text x={x + w / 2} y={y + h / 2} {...CHALK_TEXT}>
            {label}
          </text>
        </g>
      ))}

      {/* Arrows */}
      {ARROWS.map(({ x1, y1, x2, y2 }, i) => {
        const { line, head } = sketchArrow(x1, y1, x2, y2);
        return (
          <g key={`arrow-${i}`}>
            <path d={line} {...CHALK} />
            <path d={head} {...CHALK} />
          </g>
        );
      })}

      {/* Annotation labels — small chalk notes */}
      <text x={155} y={48} {...CHALK_TEXT} fontSize={7} fontStyle="italic" opacity={0.7}>
        ingest
      </text>
      <text x={310} y={48} {...CHALK_TEXT} fontSize={7} fontStyle="italic" opacity={0.7}>
        embed + index
      </text>
      <text x={250} y={112} {...CHALK_TEXT} fontSize={7} fontStyle="italic" opacity={0.7}>
        tools/call
      </text>
      <text x={315} y={138} {...CHALK_TEXT} fontSize={7} fontStyle="italic" opacity={0.7}>
        Claude / SK
      </text>
      <text x={250} y={188} {...CHALK_TEXT} fontSize={7} fontStyle="italic" opacity={0.7}>
        confidence gate
      </text>

      {/* Bottom annotation */}
      <text x={240} y={248} {...CHALK_TEXT} fontSize={7} letterSpacing={1.5} opacity={0.5}>
        governed RAG platform
      </text>
    </svg>
  );
}
