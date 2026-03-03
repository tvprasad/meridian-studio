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