// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.
//
// aiPolaris API client — ADR-011
//
// Connects Studio to the aiPolaris Planner → Retriever → Synthesizer DAG.
// Base URL: VITE_AIPOLARIS_URL (never hardcoded — ADR-011).
//
// TODO: pass Authorization header once ADR-011 JWT wiring is complete.
//       aiPolaris AUTH_ENABLED=false for this integration phase.

import { config } from '../config';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DagStage = 'planner' | 'retriever' | 'synthesizer';
export type DagStageStatus = 'idle' | 'running' | 'done' | 'error';

export interface StepRecord {
  node_name: string;
  input_hash: string;
  tool_calls: string[];
  output_hash: string;
  latency_ms: number;
  timestamp: string;
}

export interface TraceContext {
  trace_id: string;
  steps: StepRecord[];
}

export interface PolarisChunk {
  title: string;
  content: string;
  source: string;
  last_modified: string;
  reranker_score: number;
}

export interface PolarisCitation {
  title: string;
  source: string;
  excerpt: string;
}

// SSE event shapes from aiPolaris /query endpoint
export interface PolarisTokenEvent {
  type: 'token';
  content: string;
}

export interface PolarisDoneEvent {
  type: 'done';
  citations: PolarisCitation[];
  trace_id: string;
  latency_ms: number;
}

export interface PolarisErrorEvent {
  type: 'error';
  message: string;
}

export type PolarisStreamEvent =
  | PolarisTokenEvent
  | PolarisDoneEvent
  | PolarisErrorEvent;

// Enriched DAG node state for UI rendering
export interface DagNodeState {
  stage: DagStage;
  status: DagStageStatus;
  label: string;
  sublabel: string;                // e.g. "2 sub-tasks" | "5 chunks" | "3 citations"
  latency_ms: number | null;
  // Expanded drawer content
  subTasks?: string[];             // Planner output
  chunks?: PolarisChunk[];         // Retriever output
  citations?: PolarisCitation[];   // Synthesizer output
  errorHint?: string;              // Actionable recovery hint on failure
}

export interface PolarisQueryResult {
  answer: string;
  citations: PolarisCitation[];
  trace_id: string;
  session_id: string;
  latency_ms: number;
  dagNodes: DagNodeState[];
}

export interface AiPolarisError extends Error {
  stage?: DagStage;
  hint?: string;
}

// ── Stage progress inference from SSE ────────────────────────────────────────

// aiPolaris SSE events don't include per-stage notifications in the current
// implementation — we infer stage from token arrival timing.
// When StepRecord data is available in the done event, we backfill latencies.

function initialDagNodes(): DagNodeState[] {
  return [
    { stage: 'planner',     status: 'idle', label: 'Planner',     sublabel: 'Decomposing question',  latency_ms: null },
    { stage: 'retriever',   status: 'idle', label: 'Retriever',   sublabel: 'Searching knowledge base', latency_ms: null },
    { stage: 'synthesizer', status: 'idle', label: 'Synthesizer', sublabel: 'Assembling answer',     latency_ms: null },
  ];
}

// ── Error hints per stage ─────────────────────────────────────────────────────

const STAGE_ERROR_HINTS: Record<DagStage, string> = {
  planner:     'The Planner could not decompose this question — try rephrasing it more specifically.',
  retriever:   'The Retriever found no relevant documents — try broadening or rephrasing the question.',
  synthesizer: 'The Synthesizer could not produce an answer from the retrieved content — the knowledge base may not cover this topic.',
};

// ── API client ────────────────────────────────────────────────────────────────

export type StageUpdateCallback = (nodes: DagNodeState[]) => void;

/**
 * Stream a query through the aiPolaris DAG.
 *
 * Calls POST /query on the aiPolaris API with SSE streaming.
 * Invokes onStageUpdate as each stage transitions (idle → running → done).
 * Resolves with the full PolarisQueryResult on completion.
 * Rejects with AiPolarisError on network or stage failure.
 *
 * ADR-011: BASE URL from VITE_AIPOLARIS_URL — never hardcoded.
 * ADR-011: No Authorization header — AUTH_ENABLED=false in this phase.
 */
export async function streamPolarisQuery(
  query: string,
  sessionId: string | null,
  onToken: (token: string) => void,
  onStageUpdate: StageUpdateCallback,
  signal?: AbortSignal,
): Promise<PolarisQueryResult> {
  const baseUrl = config.aipolarisBaseUrl;
  const nodes = initialDagNodes();

  // Planner starts immediately on request
  nodes[0] = { ...nodes[0], status: 'running', sublabel: 'Planning...' };
  onStageUpdate([...nodes]);

  const body: Record<string, unknown> = { query };
  if (sessionId) body.session_id = sessionId;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    const apiErr = new Error('Failed to connect to aiPolaris') as AiPolarisError;
    apiErr.stage = 'planner';
    apiErr.hint = STAGE_ERROR_HINTS.planner;
    nodes[0] = { ...nodes[0], status: 'error', errorHint: STAGE_ERROR_HINTS.planner };
    onStageUpdate([...nodes]);
    throw apiErr;
  }

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    const apiErr = new Error(detail?.detail || `aiPolaris error: ${response.status}`) as AiPolarisError;
    apiErr.stage = 'planner';
    apiErr.hint = STAGE_ERROR_HINTS.planner;
    nodes[0] = { ...nodes[0], status: 'error', errorHint: STAGE_ERROR_HINTS.planner };
    onStageUpdate([...nodes]);
    throw apiErr;
  }

  // Response headers carry session + trace IDs
  const responseSessionId = response.headers.get('X-Session-Id') ?? (sessionId || crypto.randomUUID());
  const responseTraceId   = response.headers.get('X-Trace-Id') ?? '';

  // Planner done → Retriever running (first token arrival = planner + retriever complete)
  nodes[0] = { ...nodes[0], status: 'done', sublabel: 'Done', latency_ms: null };
  nodes[1] = { ...nodes[1], status: 'running', sublabel: 'Retrieving...' };
  onStageUpdate([...nodes]);

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body from aiPolaris');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  const answerTokens: string[] = [];
  let citations: PolarisCitation[] = [];
  let latency_ms = 0;
  let firstToken = true;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;

        let event: PolarisStreamEvent;
        try {
          event = JSON.parse(raw) as PolarisStreamEvent;
        } catch {
          continue;
        }

        if (event.type === 'token') {
          // First token: retriever done → synthesizer running
          if (firstToken) {
            firstToken = false;
            nodes[1] = { ...nodes[1], status: 'done', sublabel: 'Done', latency_ms: null };
            nodes[2] = { ...nodes[2], status: 'running', sublabel: 'Synthesizing...' };
            onStageUpdate([...nodes]);
          }
          answerTokens.push(event.content);
          onToken(event.content);

        } else if (event.type === 'done') {
          citations = event.citations;
          latency_ms = event.latency_ms;
          nodes[2] = {
            ...nodes[2],
            status: 'done',
            sublabel: `${citations.length} citation${citations.length !== 1 ? 's' : ''}`,
            latency_ms: event.latency_ms,
            citations,
          };
          onStageUpdate([...nodes]);

        } else if (event.type === 'error') {
          // Determine which stage failed based on answer state
          const failedStage: DagStage = firstToken ? 'retriever' : 'synthesizer';
          const stageIdx = failedStage === 'retriever' ? 1 : 2;
          nodes[stageIdx] = {
            ...nodes[stageIdx],
            status: 'error',
            errorHint: STAGE_ERROR_HINTS[failedStage],
          };
          onStageUpdate([...nodes]);
          const apiErr = new Error(event.message) as AiPolarisError;
          apiErr.stage = failedStage;
          apiErr.hint = STAGE_ERROR_HINTS[failedStage];
          throw apiErr;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return {
    answer: answerTokens.join(''),
    citations,
    trace_id: responseTraceId,
    session_id: responseSessionId,
    latency_ms,
    dagNodes: nodes,
  };
}

/**
 * Complexity heuristic for auto-routing hint.
 * Returns true if the query looks like it would benefit from Agent Query.
 * Used to show a suggestion banner — never silently switches modes.
 */
export function isComplexQuery(query: string): boolean {
  const q = query.toLowerCase().trim();
  const multiStepPatterns = [
    /\band\b.*\band\b/,           // "X and Y and Z"
    /\bhow does .+ compare/,      // comparison
    /\bwhat .+ and (who|when|where|how)\b/, // compound
    /\bsteps?\b.*\band\b/,        // steps + conjunction
    /\bdifference between\b/,
    /\bpros and cons\b/,
    /\bwalk me through\b/,
    /\bexplain .+ and .+/,
  ];
  return multiStepPatterns.some(p => p.test(q));
}
