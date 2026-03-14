// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { api } from './client';
import type {
  AzureAIResponse,
  SentimentResult,
  EntityResult,
  VisionResult,
  OcrResult,
  SpeechTranscriptResult,
  DocumentAnalysisResult,
} from './types';

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
    return api.postForm<AzureAIResponse<OcrResult>>('/azure-ai/vision/ocr', formData);
  },

  // Speech
  transcribe: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.postForm<AzureAIResponse<SpeechTranscriptResult>>('/azure-ai/speech/transcribe', formData);
  },

  textToSpeech: (text: string, voice = 'en-US-JennyNeural') =>
    api.postForBlob('/azure-ai/speech/synthesize', { text, voice }),

  // Document Intelligence
  analyzeDocument: (file: File, modelId = 'prebuilt-read') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_id', modelId);
    return api.postForm<DocumentAnalysisResult>('/azure-ai/document/analyze', formData);
  },
};
