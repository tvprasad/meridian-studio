// ===========================================
// Meridian API Types
// ===========================================

export type QueryStatus = 'OK' | 'REFUSED' | 'UNINITIALIZED';

export interface QueryResponse {
  status: QueryStatus;
  trace_id: string;
  confidence_score: number;
  answer?: string;
  refusal_reason?: string;
  threshold?: number;
}

export interface HealthResponse {
  status: string;
  document_count: number;
  llm_provider: string;
  retrieval_provider: string;
  retrieval_threshold: number;
}

export interface UpdateSettingsPayload {
  llm_provider: 'local' | 'azure';
  retrieval_provider: 'chroma' | 'azure';
  retrieval_threshold: number;
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
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