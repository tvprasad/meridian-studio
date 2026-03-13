import { type ReactNode } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from './useAuth';
import { version } from '../../package.json';

const FLOATING_WORDS = [
  { text: 'RAG', top: '8%', left: '12%', delay: '0s', duration: '20s' },
  { text: 'Agents', top: '15%', left: '78%', delay: '2s', duration: '18s' },
  { text: 'Orchestration', top: '25%', left: '5%', delay: '4s', duration: '22s' },
  { text: 'Guardrails', top: '72%', left: '82%', delay: '1s', duration: '19s' },
  { text: 'Hallucination', top: '80%', left: '8%', delay: '3s', duration: '21s' },
  { text: 'Embeddings', top: '35%', left: '88%', delay: '5s', duration: '17s' },
  { text: 'Chunking', top: '60%', left: '3%', delay: '7s', duration: '23s' },
  { text: 'Confidence', top: '45%', left: '92%', delay: '6s', duration: '16s' },
  { text: 'Governance', top: '88%', left: '72%', delay: '8s', duration: '20s' },
  { text: 'Retrieval', top: '5%', left: '45%', delay: '9s', duration: '18s' },
  { text: 'Grounding', top: '92%', left: '35%', delay: '2s', duration: '22s' },
  { text: 'Reasoning', top: '18%', left: '55%', delay: '4s', duration: '19s' },
  { text: 'Citations', top: '68%', left: '90%', delay: '6s', duration: '21s' },
  { text: 'ReAct', top: '50%', left: '6%', delay: '1s', duration: '17s' },
  { text: 'Tool Use', top: '40%', left: '75%', delay: '3s', duration: '24s' },
  { text: 'Semantic Search', top: '78%', left: '48%', delay: '5s', duration: '20s' },
];

// Neural network nodes (x%, y%) and edges (from, to, pulse delay)
const NODES = [
  { x: 8, y: 15 }, { x: 22, y: 8 }, { x: 38, y: 20 }, { x: 55, y: 10 },
  { x: 72, y: 18 }, { x: 88, y: 12 }, { x: 5, y: 45 }, { x: 18, y: 55 },
  { x: 35, y: 42 }, { x: 50, y: 50 }, { x: 65, y: 45 }, { x: 82, y: 52 },
  { x: 95, y: 40 }, { x: 10, y: 78 }, { x: 25, y: 85 }, { x: 42, y: 75 },
  { x: 58, y: 82 }, { x: 75, y: 78 }, { x: 90, y: 85 }, { x: 48, y: 32 },
];

const EDGES: [number, number, number][] = [
  [0, 1, 0], [1, 2, 2], [2, 3, 4], [3, 4, 1], [4, 5, 3],
  [0, 6, 5], [6, 7, 7], [7, 8, 2], [8, 9, 0], [9, 10, 4],
  [10, 11, 6], [11, 12, 1], [1, 8, 3], [3, 19, 5], [19, 9, 8],
  [4, 10, 2], [7, 13, 6], [13, 14, 0], [14, 15, 3], [15, 16, 7],
  [16, 17, 1], [17, 18, 4], [9, 15, 5], [10, 17, 2], [2, 19, 6],
  [5, 12, 8], [6, 13, 3], [8, 15, 1], [12, 18, 7], [19, 10, 4],
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

        {/* Neural network wiring */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="node-glow">
              <stop offset="0%" stopColor="rgba(167,139,250,0.6)" />
              <stop offset="100%" stopColor="rgba(167,139,250,0)" />
            </radialGradient>
          </defs>

          {/* Connection lines */}
          {EDGES.map(([from, to, delay], i) => {
            const a = NODES[from];
            const b = NODES[to];
            return (
              <g key={`edge-${i}`}>
                {/* Static wire */}
                <line
                  x1={`${a.x}%`} y1={`${a.y}%`}
                  x2={`${b.x}%`} y2={`${b.y}%`}
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="1"
                />
                {/* Traveling pulse */}
                <circle r="2" fill="rgba(167,139,250,0.5)">
                  <animateMotion
                    dur={`${6 + (i % 5)}s`}
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                    path={`M${a.x * 10},${a.y * 10} L${b.x * 10},${b.y * 10}`}
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    dur={`${6 + (i % 5)}s`}
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}

          {/* Nodes with pulse */}
          {NODES.map((node, i) => (
            <g key={`node-${i}`}>
              <circle
                cx={`${node.x}%`} cy={`${node.y}%`}
                r="1.5"
                fill="rgba(167,139,250,0.3)"
              />
              <circle
                cx={`${node.x}%`} cy={`${node.y}%`}
                r="1.5"
                fill="none"
                stroke="rgba(167,139,250,0.15)"
                strokeWidth="1"
              >
                <animate
                  attributeName="r"
                  values="1.5;6;1.5"
                  dur={`${4 + (i % 3)}s`}
                  begin={`${i * 0.7}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.3;0;0.3"
                  dur={`${4 + (i % 3)}s`}
                  begin={`${i * 0.7}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
        </svg>

        {/* Floating keyword pills */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {FLOATING_WORDS.map(({ text, top, left, delay, duration }) => (
            <span
              key={text}
              className="absolute text-xs font-medium tracking-wider uppercase text-white/[0.15] select-none"
              style={{
                top,
                left,
                animation: `float ${duration} ease-in-out ${delay} infinite`,
              }}
            >
              {text}
            </span>
          ))}
        </div>

        {/* Iridescent top accent */}
        <div className="h-1 bg-gradient-to-r from-orange-400 via-violet-500 to-teal-400 shrink-0 relative z-10" />

        <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
          <div className="text-center space-y-8 max-w-sm">
            {/* Logo + branding */}
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg mx-auto ring-1 ring-white/10">
                <img src="/vpllogo.jfif" alt="VPL" className="w-full h-full object-contain" />
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

            {/* Version */}
            <p className="text-xs text-white/20">v{version}</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
