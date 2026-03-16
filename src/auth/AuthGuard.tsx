// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { type ReactNode } from 'react';
import {
  LogIn, Bot, Brain, Search, Upload, Scissors, Layers, Database,
  Shield, Eye, Mic, FileText, Languages, MessageSquare, Workflow, Sparkles,
  Users, Headset, TicketCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from './useAuth';
import { ArchitectureSketch } from '../components/ui/ArchitectureSketch';
import { version } from '../../package.json';

// ── Geometric art data ──────────────────────────────────────────────────────

// Concentric ring centers (x%, y%, max-radius, ring-count)
const RINGS: [number, number, number, number][] = [
  [12, 18, 120, 5],
  [85, 25, 90, 4],
  [8, 80, 100, 4],
  [90, 78, 110, 5],
  [50, 50, 80, 3],
];

// Flowing bezier curves — organic paths across the canvas
// Each: [startX, startY, cp1X, cp1Y, cp2X, cp2Y, endX, endY]
const CURVES: [number, number, number, number, number, number, number, number][] = [
  [0, 200, 250, 50, 550, 350, 1000, 150],
  [0, 500, 200, 300, 400, 700, 1000, 450],
  [0, 800, 300, 600, 700, 900, 1000, 700],
  [100, 0, 50, 300, 350, 200, 200, 1000],
  [500, 0, 400, 400, 600, 600, 550, 1000],
  [850, 0, 900, 350, 750, 650, 800, 1000],
];

// Triangle mesh vertices (x, y in viewBox 1000x1000) and face indices
const MESH_VERTS = [
  [80, 120], [220, 60], [380, 160], [550, 80], [720, 150], [880, 100],
  [50, 380], [180, 460], [350, 350], [500, 420], [650, 380], [820, 440],
  [950, 330], [100, 650], [250, 720], [420, 630], [580, 700], [750, 650],
  [900, 720], [480, 260],
];

// Floating capability icons — position, icon, label, animation timing
const CAPABILITY_ICONS: { Icon: LucideIcon; label: string; top: string; left: string; delay: string; duration: string; size: number }[] = [
  // Agents & reasoning
  { Icon: Bot, label: 'Agents', top: '8%', left: '10%', delay: '0s', duration: '20s', size: 28 },
  { Icon: Brain, label: 'Reasoning', top: '15%', left: '82%', delay: '3s', duration: '18s', size: 24 },
  { Icon: Sparkles, label: 'AI Engine', top: '22%', left: '60%', delay: '5s', duration: '22s', size: 22 },
  // Query & search
  { Icon: Search, label: 'Query', top: '70%', left: '85%', delay: '2s', duration: '19s', size: 26 },
  { Icon: MessageSquare, label: 'Chat', top: '55%', left: '5%', delay: '7s', duration: '21s', size: 24 },
  // Ingestion pipeline
  { Icon: Upload, label: 'Upload', top: '82%', left: '12%', delay: '1s', duration: '17s', size: 22 },
  { Icon: Scissors, label: 'Chunk', top: '88%', left: '30%', delay: '2s', duration: '19s', size: 20 },
  { Icon: Layers, label: 'Embed', top: '85%', left: '50%', delay: '3s', duration: '21s', size: 20 },
  { Icon: Database, label: 'Index', top: '80%', left: '68%', delay: '4s', duration: '18s', size: 22 },
  // Governance & security
  { Icon: Shield, label: 'Governance', top: '35%', left: '90%', delay: '6s', duration: '23s', size: 26 },
  { Icon: Workflow, label: 'Pipeline', top: '42%', left: '4%', delay: '4s', duration: '20s', size: 24 },
  // Cognitive services
  { Icon: Eye, label: 'Vision', top: '5%', left: '40%', delay: '8s', duration: '22s', size: 20 },
  { Icon: Mic, label: 'Speech', top: '12%', left: '55%', delay: '1s', duration: '19s', size: 20 },
  { Icon: FileText, label: 'Documents', top: '68%', left: '92%', delay: '5s', duration: '17s', size: 22 },
  { Icon: Languages, label: 'Language', top: '92%', left: '78%', delay: '3s', duration: '24s', size: 20 },
  // Customer-facing
  { Icon: Users, label: 'Customers', top: '62%', left: '12%', delay: '2s', duration: '20s', size: 24 },
  { Icon: Headset, label: 'Support', top: '75%', left: '40%', delay: '6s', duration: '22s', size: 22 },
  { Icon: TicketCheck, label: 'SLA', top: '30%', left: '15%', delay: '4s', duration: '18s', size: 20 },
];

// ── Multi-agent orchestration layout ────────────────────────────────────────
// Central orchestrator at (500,420) — offset above viewBox center to match
// the logo position (logo sits above center in the flex-centered content block).
const ORCH_CENTER = { x: 500, y: 420, label: 'Orchestrator' };
const ORCH_RADIUS = 180;
const ORCH_AGENTS = [
  'RAG Agent', 'Search Agent', 'Guardrail Agent', 'Customer Agent',
  'Ingest Agent', 'Eval Agent', 'Tool Agent',
].map((label, i) => {
  const angle = (Math.PI * 2 * i) / 7 - Math.PI / 2; // start at top
  return {
    label,
    x: Math.round(ORCH_CENTER.x + ORCH_RADIUS * Math.cos(angle)),
    y: Math.round(ORCH_CENTER.y + ORCH_RADIUS * Math.sin(angle)),
  };
});

// Hub-spoke connections (orchestrator <-> each agent) + select agent-to-agent links
const ORCH_SPOKES = ORCH_AGENTS.map((a) => ({
  from: ORCH_CENTER, to: a, bidir: true,
}));
const ORCH_CROSS: { from: number; to: number }[] = [
  { from: 0, to: 1 }, // RAG <-> Search
  { from: 2, to: 4 }, // Guardrail <-> Eval
  { from: 3, to: 0 }, // Ingest -> RAG
  { from: 5, to: 1 }, // Tool -> Search
];

// Pre-computed triangles (indices into MESH_VERTS)
const TRIANGLES: [number, number, number][] = [
  [0, 1, 6], [1, 2, 19], [2, 3, 19], [3, 4, 19], [4, 5, 12],
  [0, 6, 7], [1, 7, 8], [1, 19, 8], [19, 9, 8], [19, 3, 9],
  [3, 4, 10], [4, 10, 11], [4, 11, 12], [5, 12, 11],
  [6, 7, 13], [7, 13, 14], [7, 8, 14], [8, 9, 15], [8, 14, 15],
  [9, 10, 15], [10, 16, 15], [10, 11, 17], [10, 16, 17],
  [11, 12, 18], [11, 17, 18], [14, 15, 16], [16, 17, 18],
];

export function AuthGuard({ children }: { children: ReactNode }) {
  const { authEnabled, isAuthenticated, login } = useAuth();

  // Auth disabled — everything is accessible
  if (!authEnabled) return <>{children}</>;

  // Auth enabled but not yet authenticated — branded sign-in screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden relative">
        {/* Animated aurora blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-[80vw] h-[80vw] rounded-full bg-violet-600/15 blur-[120px] animate-[drift_12s_ease-in-out_infinite]" />
          <div className="absolute -bottom-1/3 -right-1/4 w-[60vw] h-[60vw] rounded-full bg-teal-500/10 blur-[100px] animate-[drift_15s_ease-in-out_infinite_reverse]" />
          <div className="absolute top-1/4 right-1/3 w-[40vw] h-[40vw] rounded-full bg-orange-400/8 blur-[80px] animate-[drift_18s_ease-in-out_infinite_2s]" />
        </div>

        {/* Geometric art layer */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="node-glow">
              <stop offset="0%" stopColor="rgba(167,139,250,0.6)" />
              <stop offset="100%" stopColor="rgba(167,139,250,0)" />
            </radialGradient>
            <linearGradient id="curve-violet-teal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(167,139,250,0.12)" />
              <stop offset="100%" stopColor="rgba(45,212,191,0.08)" />
            </linearGradient>
            <linearGradient id="curve-orange-violet" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(251,146,60,0.08)" />
              <stop offset="100%" stopColor="rgba(167,139,250,0.12)" />
            </linearGradient>
          </defs>

          {/* Layer 1: Triangular mesh */}
          {TRIANGLES.map(([a, b, c], i) => {
            const va = MESH_VERTS[a];
            const vb = MESH_VERTS[b];
            const vc = MESH_VERTS[c];
            return (
              <g key={`tri-${i}`}>
                <polygon
                  points={`${va[0]},${va[1]} ${vb[0]},${vb[1]} ${vc[0]},${vc[1]}`}
                  fill="none"
                  stroke="rgba(167,139,250,0.04)"
                  strokeWidth="0.8"
                />
                {/* Subtle fill on every 3rd triangle */}
                {i % 3 === 0 && (
                  <polygon
                    points={`${va[0]},${va[1]} ${vb[0]},${vb[1]} ${vc[0]},${vc[1]}`}
                    fill="rgba(167,139,250,0.015)"
                    stroke="none"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.3;1;0.3"
                      dur={`${8 + (i % 5)}s`}
                      begin={`${i * 0.4}s`}
                      repeatCount="indefinite"
                    />
                  </polygon>
                )}
              </g>
            );
          })}

          {/* Layer 2: Mesh vertices with glow */}
          {MESH_VERTS.map(([x, y], i) => (
            <g key={`vert-${i}`}>
              <circle cx={x} cy={y} r="12" fill="url(#node-glow)" opacity="0.3" />
              <circle cx={x} cy={y} r="2.5" fill="rgba(167,139,250,0.4)" />
              <circle cx={x} cy={y} r="1" fill="rgba(221,214,254,0.7)" />
              <circle cx={x} cy={y} r="2.5" fill="none" stroke="rgba(167,139,250,0.15)" strokeWidth="0.5">
                <animate
                  attributeName="r"
                  values="2.5;18;2.5"
                  dur={`${5 + (i % 4)}s`}
                  begin={`${i * 0.6}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.3;0;0.3"
                  dur={`${5 + (i % 4)}s`}
                  begin={`${i * 0.6}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}

          {/* Layer 3: Flowing bezier curves (static, no traveling dots) */}
          {CURVES.map(([sx, sy, c1x, c1y, c2x, c2y, ex, ey], i) => (
            <path
              key={`curve-${i}`}
              d={`M${sx},${sy} C${c1x},${c1y} ${c2x},${c2y} ${ex},${ey}`}
              fill="none"
              stroke={i % 2 === 0 ? 'url(#curve-violet-teal)' : 'url(#curve-orange-violet)'}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          ))}

          {/* Layer 4: Concentric rings */}
          {RINGS.map(([cx, cy, maxR, count], i) => (
            <g key={`ring-${i}`}>
              {Array.from({ length: count }, (_, j) => {
                const r = ((j + 1) / count) * maxR;
                return (
                  <circle
                    key={j}
                    cx={cx * 10}
                    cy={cy * 10}
                    r={r}
                    fill="none"
                    stroke={j % 2 === 0 ? 'rgba(167,139,250,0.03)' : 'rgba(45,212,191,0.02)'}
                    strokeWidth="0.6"
                    strokeDasharray={j % 2 === 0 ? 'none' : '4 8'}
                  >
                    <animate
                      attributeName="r"
                      values={`${r};${r + 8};${r}`}
                      dur={`${6 + j * 2}s`}
                      begin={`${i + j}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="1;0.4;1"
                      dur={`${6 + j * 2}s`}
                      begin={`${i + j}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                );
              })}
            </g>
          ))}
          {/* Layer 5: Multi-agent orchestration */}
          <g opacity="0.7">
            {/* Hex ring outline */}
            <polygon
              points={ORCH_AGENTS.map((a) => `${a.x},${a.y}`).join(' ')}
              fill="none"
              stroke="rgba(167,139,250,0.1)"
              strokeWidth="1"
              strokeDasharray="6 4"
            />

            {/* Hub-spoke connections with animated pulses */}
            {ORCH_SPOKES.map(({ from, to }, i) => {
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              // Control point offset for a subtle curve
              const cx = (from.x + to.x) / 2 + dy * 0.15;
              const cy = (from.y + to.y) / 2 - dx * 0.15;
              const pathD = `M${from.x},${from.y} Q${cx},${cy} ${to.x},${to.y}`;
              return (
                <g key={`spoke-${i}`}>
                  <path d={pathD} fill="none" stroke="rgba(167,139,250,0.15)" strokeWidth="1.2" />
                  {/* Outbound pulse: orchestrator -> agent */}
                  <circle r="2.5" fill="rgba(45,212,191,0.7)">
                    <animateMotion dur={`${4 + i}s`} begin={`${i * 0.8}s`} repeatCount="indefinite" path={pathD} />
                    <animate attributeName="opacity" values="0;1;1;0" dur={`${4 + i}s`} begin={`${i * 0.8}s`} repeatCount="indefinite" />
                  </circle>
                  {/* Return pulse: agent -> orchestrator */}
                  <circle r="2" fill="rgba(251,146,60,0.6)">
                    <animateMotion dur={`${5 + i}s`} begin={`${i * 0.8 + 2}s`} repeatCount="indefinite" path={pathD} keyPoints="1;0" keyTimes="0;1" />
                    <animate attributeName="opacity" values="0;0.8;0.8;0" dur={`${5 + i}s`} begin={`${i * 0.8 + 2}s`} repeatCount="indefinite" />
                  </circle>
                </g>
              );
            })}

            {/* Cross-agent collaboration links */}
            {ORCH_CROSS.map(({ from, to }, i) => {
              const a = ORCH_AGENTS[from];
              const b = ORCH_AGENTS[to];
              const pathD = `M${a.x},${a.y} L${b.x},${b.y}`;
              return (
                <g key={`cross-${i}`}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(45,212,191,0.1)" strokeWidth="1" strokeDasharray="3 6" />
                  <circle r="1.5" fill="rgba(167,139,250,0.5)">
                    <animateMotion dur={`${7 + i * 2}s`} begin={`${i + 1}s`} repeatCount="indefinite" path={pathD} />
                    <animate attributeName="opacity" values="0;0.6;0.6;0" dur={`${7 + i * 2}s`} begin={`${i + 1}s`} repeatCount="indefinite" />
                  </circle>
                </g>
              );
            })}

            {/* Agent nodes (hub rings are rendered in HTML around the logo) */}
            {ORCH_AGENTS.map((agent, i) => (
              <g key={`agent-${i}`}>
                <circle cx={agent.x} cy={agent.y} r="22" fill="url(#node-glow)" opacity="0.6" />
                <circle cx={agent.x} cy={agent.y} r="10" fill="none" stroke="rgba(167,139,250,0.25)" strokeWidth="1" />
                <circle cx={agent.x} cy={agent.y} r="5" fill="rgba(167,139,250,0.45)" />
                <circle cx={agent.x} cy={agent.y} r="2" fill="rgba(221,214,254,0.8)" />
                {/* Agent pulse ring */}
                <circle cx={agent.x} cy={agent.y} r="10" fill="none" stroke="rgba(45,212,191,0.15)" strokeWidth="0.6">
                  <animate attributeName="r" values="10;26;10" dur={`${5 + (i % 3)}s`} begin={`${i * 0.5}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur={`${5 + (i % 3)}s`} begin={`${i * 0.5}s`} repeatCount="indefinite" />
                </circle>
                <text x={agent.x} y={agent.y + 20} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="system-ui" fontWeight="500" letterSpacing="1.5">
                  {agent.label.toUpperCase()}
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* Floating capability icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {CAPABILITY_ICONS.map(({ Icon, label, top, left, delay, duration, size }) => (
            <div
              key={label}
              className="absolute flex flex-col items-center gap-1 select-none"
              style={{
                top,
                left,
                animation: `float ${duration} ease-in-out ${delay} infinite`,
              }}
            >
              <Icon
                className="text-violet-400/25"
                size={size + 6}
                strokeWidth={1}
              />
              <span className="text-[10px] uppercase tracking-widest text-white/[0.18] font-medium">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Hand-drawn architecture sketch — bottom-right, low opacity */}
        <ArchitectureSketch />

        {/* Iridescent top accent */}
        <div className="h-1 bg-gradient-to-r from-orange-400 via-violet-500 to-teal-400 shrink-0 relative z-10" />

        <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
          <div className="text-center space-y-8 max-w-sm">
            {/* Logo + orchestrator hub rings */}
            <div className="space-y-4">
              <div className="relative mx-auto w-14 h-14">
                {/* Hub rings centered on logo */}
                <svg
                  className="absolute pointer-events-none"
                  style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px' }}
                  viewBox="0 0 200 200"
                >
                  {/* Glow halo */}
                  <circle cx="100" cy="100" r="70" fill="url(#node-glow)" />
                  {/* Inner ring */}
                  <circle cx="100" cy="100" r="38" fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="1.2" />
                  {/* Outer ring */}
                  <circle cx="100" cy="100" r="56" fill="none" stroke="rgba(167,139,250,0.15)" strokeWidth="0.8" strokeDasharray="4 3" />
                  {/* Pulse 1 */}
                  <circle cx="100" cy="100" r="38" fill="none" stroke="rgba(167,139,250,0.2)" strokeWidth="1">
                    <animate attributeName="r" values="38;75;38" dur="4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="4s" repeatCount="indefinite" />
                  </circle>
                  {/* Pulse 2 — teal, offset */}
                  <circle cx="100" cy="100" r="56" fill="none" stroke="rgba(45,212,191,0.12)" strokeWidth="0.6">
                    <animate attributeName="r" values="56;90;56" dur="5s" begin="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0;0.3" dur="5s" begin="1.5s" repeatCount="indefinite" />
                  </circle>
                </svg>
                {/* Logo */}
                <a href="https://vplsolutions.com" target="_blank" rel="noopener noreferrer" className="relative w-14 h-14 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/10 block">
                  <img src="/vpllogo.jfif" alt="Meridian Studio" className="w-full h-full object-contain" />
                </a>
              </div>
              <div>
                <h1 className="text-2xl font-bold iridescent-text">Meridian Studio</h1>
                <p className="text-sm text-white/40 mt-1">Governed AI Platform</p>
              </div>
            </div>

            {/* Sign-in card */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-8 space-y-5 backdrop-blur-md shadow-2xl">
              <p className="text-sm text-white/60">
                Sign in with your Microsoft account to access the knowledge engine.
              </p>
              <button
                onClick={() => login()}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-teal-500 text-white text-sm font-medium hover:from-violet-500 hover:to-teal-400 transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            </div>

            {/* Trusted by */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-white/20">Trusted by</p>
              <div className="flex items-center justify-center gap-6">
                {['Contoso', 'Northwind', 'Fabrikam', 'Tailspin'].map((name) => (
                  <span key={name} className="text-[11px] font-medium tracking-wide text-white/15">
                    {name}
                  </span>
                ))}
              </div>
            </div>

            {/* Version */}
            <p className="text-xs text-white/20">v{version}</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
