// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

// ===========================================
// Meridian API Types
// ===========================================

export type QueryStatus = 'OK' | 'REFUSED' | 'UNINITIALIZED';

export interface QueryResponse {
  status: QueryStatus;
  trace_id: string;
  confidence_score: number;
  raw_confidence?: number | null;
  answer?: string;
  refusal_reason?: string;
  threshold?: number;
  retrieval_scores?: number[];
}

// ===========================================
// SSE Streaming Types (ADR-0010)
// ===========================================

export type StreamEventType = 'metadata' | 'token' | 'done' | 'error';

export interface StreamMetadataEvent {
  type: 'metadata';
  data: {
    trace_id: string;
    status: 'OK';
    confidence_score: number;
    raw_confidence?: number | null;
    threshold: number;
    retrieval_scores: number[];
    t_retrieve_ms: number;
  };
}

export interface StreamTokenEvent {
  type: 'token';
  data: { text: string };
}

export interface StreamDoneEvent {
  type: 'done';
  data: {
    trace_id: string;
    t_retrieve_ms: number;
    t_generate_ms: number;
    t_total_ms: number;
  };
}

export interface StreamErrorEvent {
  type: 'error';
  data: {
    trace_id: string;
    status: 'REFUSED' | 'UNINITIALIZED';
    refusal_reason: string;
    confidence_score?: number;
    raw_confidence?: number | null;
    threshold?: number;
  };
}

export type StreamEvent = StreamMetadataEvent | StreamTokenEvent | StreamDoneEvent | StreamErrorEvent;

export interface McpQueryResult {
  status: string;
  trace_id: string;
  confidence: number;
  answer?: string;
  reason?: string;
  threshold?: number;
}

export interface HealthResponse {
  status: string;
  document_count: number;
  llm_provider: string;
  retrieval_provider: string;
  retrieval_threshold: number;
  suggested_questions?: string[];
}

export interface SettingsResponse {
  llm_provider: string;
  retrieval_provider: string;
  retrieval_threshold: number;
  temperature: number;
}

export interface UpdateSettingsPayload {
  llm_provider: 'local' | 'azure';
  retrieval_provider: 'chroma' | 'azure';
  retrieval_threshold: number;
  temperature: number;
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface IngestResponse {
  ingested: number;
  chunks: number;
  message?: string;
}

export interface ServiceNowIngestRequest {
  kb_name?: string;
  category?: string;
  limit?: number;
}

export interface ServiceNowIngestResponse {
  ingested: number;
  chunks: number;
  message?: string;
}

export interface ServiceNowStatusResponse {
  configured: boolean;
  last_sync: {
    started_at: string;
    completed_at?: string;
    status: string;
    ingested: number;
    chunks: number;
    delta: boolean;
    error: string | null;
  } | null;
  history: Array<Record<string, unknown>>;
}

// ===========================================
// Evaluation Types
// ===========================================

export interface QueryCitation {
  id: string | null;
  [key: string]: unknown;
}

export interface EvaluationQueryEntry {
  id: string;
  trace_id: string;
  timestamp: string;
  question: string | null;
  status: string;
  confidence: number | null;
  raw_confidence: number | null;
  chunks_retrieved: number | null;
  chunks_above: number | null;
  t_retrieve_ms: number | null;
  t_generate_ms: number | null;
  t_total_ms: number | null;
  source: string;
  feedback?: 'up' | 'down' | null;
  answer_text?: string | null;
  citations?: string | null;
}

export interface EvaluationQueriesResponse {
  configured: boolean;
  total?: number;
  limit?: number;
  offset?: number;
  queries?: EvaluationQueryEntry[];
  error?: string;
}

export interface EvaluationMetricsResponse {
  configured: boolean;
  total_queries?: number;
  avg_confidence?: number | null;
  retrieval_precision?: number | null;
  refusal_rate?: number;
  latency_p50_ms?: number | null;
  latency_p95_ms?: number | null;
  queries_by_status?: Record<string, number>;
  queries_by_source?: Record<string, number>;
  period_start?: string;
  period_end?: string;
  message?: string;
  error?: string;
}

// ===========================================
// Agent Types
// ===========================================

export interface AgentStep {
  step: number;
  tool: string;
  input: Record<string, unknown>;
  output_preview: string;
  elapsed_ms: number;
  // KB tool confidence (optional — only present for query_knowledge_base steps)
  confidence_score?: number | null;
  raw_confidence?: number | null;
  threshold?: number | null;
}

export interface AgentQueryResponse {
  trace_id: string;
  status: string;
  answer: string;
  steps: AgentStep[];
  steps_taken: number;
  elapsed_ms: number;
}

// ===========================================
// Azure AI Types
// ===========================================

export interface AzureAIResponse<T = unknown> {
  status: string;
  operation: string;
  data: T;
  request_id: string;
  elapsed_ms: number;
}

export interface SentimentResult {
  kind: string;
  results: {
    documents: Array<{
      id: string;
      sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
      confidenceScores: {
        positive: number;
        neutral: number;
        negative: number;
      };
      sentences: Array<{
        sentiment: string;
        confidenceScores: {
          positive: number;
          neutral: number;
          negative: number;
        };
        text: string;
      }>;
    }>;
  };
}

export interface EntityResult {
  kind: string;
  results: {
    documents: Array<{
      id: string;
      entities: Array<{
        text: string;
        category: string;
        confidenceScore: number;
      }>;
    }>;
  };
}

export interface VisionResult {
  captionResult?: {
    text: string;
    confidence: number;
  };
  tagsResult?: {
    values: Array<{
      name: string;
      confidence: number;
    }>;
  };
  objectsResult?: {
    values: Array<{
      tags: Array<{
        name: string;
        confidence: number;
      }>;
    }>;
  };
}

export interface OcrResult {
  readResult?: {
    blocks?: Array<{
      lines: Array<{
        text: string;
        words?: Array<{ text: string; confidence: number }>;
      }>;
    }>;
  };
  content?: string;
}

export interface SpeechTranscriptResult {
  text: string;
  duration?: number;
  words?: Array<{
    word: string;
    offset: number;
    duration: number;
  }>;
}

export interface SpeechSynthesisResult {
  audio_data?: string;
  audio_url?: string;
  duration_ms?: number;
  voice?: string;
}

export interface DocumentAnalysisResult {
  status: string;
  model_id: string;
  content?: string;
  request_id: string;
  elapsed_ms: number;
  pages?: Array<{
    pageNumber: number;
    width?: number;
    height?: number;
    lines?: Array<{
      content: string;
      polygon?: number[];
    }>;
    words?: Array<{
      content: string;
      confidence: number;
    }>;
  }>;
  paragraphs?: Array<{
    content: string;
    role?: string;
  }>;
  tables?: Array<{
    row_count: number;
    column_count: number;
    cells: Array<{
      content: string;
      row_index: number;
      column_index: number;
    }>;
  }>;
  key_value_pairs?: Array<{
    key: string;
    value: string;
    confidence: number;
  }>;
  documents?: Array<Record<string, unknown>>;
  fields?: Record<string, {
    value?: string;
    confidence?: number;
    type?: string;
  }>;
}