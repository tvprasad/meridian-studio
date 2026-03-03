import { api } from './client';
import type { AzureAIResponse, SentimentResult, EntityResult, VisionResult } from './types';

export const azureAiApi = {
  // Language
  sentiment: (text: string, language = 'en') =>
    api.post<AzureAIResponse<SentimentResult>>('/azure-ai/language/sentiment', { text, language }),

  entities: (text: string, language = 'en') =>
    api.post<AzureAIResponse<EntityResult>>('/azure-ai/language/entities', { text, language }),

  keyPhrases: (text: string, language = 'en') =>
    api.post<AzureAIResponse>('/azure-ai/language/key-phrases', { text, language }),

  detectLanguage: (text: string) =>
    api.post<AzureAIResponse>('/azure-ai/language/detect', { text }),

  // Vision
  analyzeImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.postForm<AzureAIResponse<VisionResult>>('/azure-ai/vision/analyze', formData);
  },

  ocr: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.postForm<AzureAIResponse>('/azure-ai/vision/ocr', formData);
  },
};