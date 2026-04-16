// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { azureAiApi } from '../api/azure-ai';
import { useTrackedMutation } from '../hooks/useTrackedMutation';
import { Languages, Send } from 'lucide-react';

type Tab = 'sentiment' | 'entities' | 'keyphrases' | 'detect';

const TABS: { id: Tab; label: string }[] = [
  { id: 'sentiment', label: 'Sentiment Analysis' },
  { id: 'entities', label: 'Entity Recognition' },
  { id: 'keyphrases', label: 'Key Phrases' },
  { id: 'detect', label: 'Language Detection' },
];

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  negative: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
  mixed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

const LANG_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ar', label: 'Arabic' },
];

export function LanguageIntelligence() {
  const [tab, setTab] = useState<Tab>('sentiment');
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en');

  const sentiment = useTrackedMutation({ service: 'Language', operation: 'sentiment' }, { mutationFn: ({ t, l }: { t: string; l: string }) => azureAiApi.sentiment(t, l) });
  const entities = useTrackedMutation({ service: 'Language', operation: 'entities' }, { mutationFn: ({ t, l }: { t: string; l: string }) => azureAiApi.entities(t, l) });
  const keyPhrases = useTrackedMutation({ service: 'Language', operation: 'keyPhrases' }, { mutationFn: ({ t, l }: { t: string; l: string }) => azureAiApi.keyPhrases(t, l) });
  const detect = useTrackedMutation({ service: 'Language', operation: 'detect' }, { mutationFn: (t: string) => azureAiApi.detectLanguage(t) });

  const currentMutation = { sentiment, entities, keyphrases: keyPhrases, detect }[tab];
  const isPending = currentMutation.isPending;

  const handleAnalyze = () => {
    if (!text.trim()) return;
    if (tab === 'sentiment') sentiment.mutate({ t: text, l: language });
    else if (tab === 'entities') entities.mutate({ t: text, l: language });
    else if (tab === 'keyphrases') keyPhrases.mutate({ t: text, l: language });
    else detect.mutate(text);
  };

  const hasNonDetectLanguage = tab !== 'detect';

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-900/30">
          <Languages className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Language Intelligence</h1>
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">AI Lab — Preview</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Analyze text to detect sentiment, recognize named entities, extract key phrases, and identify languages. This is a standalone Cognitive AI capability, independent of the RAG query engine.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-8 border-b border-gray-200 dark:border-white/10">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px ${
              tab === id
                ? 'bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 border-b-white dark:border-b-white/[0.05] text-violet-700 dark:text-violet-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="mt-0 rounded-tl-none">
        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <label htmlFor="language-input-text" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Input Text</label>
            <textarea
              id="language-input-text"
              rows={5}
              className="block w-full rounded-lg border border-gray-300 dark:border-white/15 p-3 text-sm dark:bg-gray-900 dark:text-gray-200 focus:border-violet-500 focus:ring-violet-500 focus:outline-none"
              placeholder="Enter text to analyze…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          {hasNonDetectLanguage && (
            <div className="w-36 shrink-0">
              <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Language</label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 dark:border-white/15 p-2.5 text-sm dark:bg-gray-900 dark:text-gray-200 focus:border-violet-500 focus:outline-none"
              >
                {LANG_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleAnalyze} loading={isPending} disabled={!text.trim()}>
            <Send className="w-4 h-4 mr-2" />
            Analyze
          </Button>
        </div>
      </Card>

      {/* Error */}
      {currentMutation.isError && (
        <Card className="mt-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-300 text-sm">{(currentMutation.error as Error).message}</p>
        </Card>
      )}

      {/* Sentiment Results */}
      {tab === 'sentiment' && sentiment.data && (() => {
        const doc = sentiment.data.data.results?.documents?.[0];
        if (!doc) return null;
        return (
          <Card className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold dark:text-white">Sentiment Result</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${SENTIMENT_COLORS[doc.sentiment] ?? 'bg-gray-100 dark:bg-gray-800'}`}>
                {doc.sentiment}
              </span>
            </div>
            <div className="flex gap-4 text-sm mb-6">
              {(['positive', 'neutral', 'negative'] as const).map((k) => (
                <div key={k} className="flex-1">
                  <p className="text-gray-500 dark:text-gray-400 capitalize mb-1">{k}</p>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${k === 'positive' ? 'bg-emerald-400' : k === 'negative' ? 'bg-red-400' : 'bg-gray-400'}`}
                      style={{ width: `${(doc.confidenceScores[k] * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{(doc.confidenceScores[k] * 100).toFixed(0)}%</p>
                </div>
              ))}
            </div>
            {doc.sentences.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Sentences</p>
                <div className="space-y-2">
                  {doc.sentences.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize shrink-0 ${SENTIMENT_COLORS[s.sentiment] ?? 'bg-gray-100 dark:bg-gray-800'}`}>
                        {s.sentiment}
                      </span>
                      <p className="text-gray-700 dark:text-gray-200">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Elapsed: {sentiment.data.elapsed_ms}ms · Request: {sentiment.data.request_id}</p>
          </Card>
        );
      })()}

      {/* Entity Results */}
      {tab === 'entities' && entities.data && (() => {
        const doc = entities.data.data.results?.documents?.[0];
        if (!doc) return null;
        return (
          <Card className="mt-6">
            <h2 className="text-lg font-semibold dark:text-white mb-4">Entities ({doc.entities.length})</h2>
            {doc.entities.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No entities detected.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {doc.entities.map((e, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-100 dark:border-violet-800">
                    <span className="text-sm font-medium text-violet-900 dark:text-violet-200">{e.text}</span>
                    <span className="text-xs text-violet-500 dark:text-violet-400 border-l border-violet-200 dark:border-violet-700 pl-1.5">{e.category}</span>
                    <span className="text-xs text-violet-400">{(e.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Elapsed: {entities.data.elapsed_ms}ms · Request: {entities.data.request_id}</p>
          </Card>
        );
      })()}

      {/* Key Phrases Results */}
      {tab === 'keyphrases' && keyPhrases.data && (() => {
        const phrases: string[] = (keyPhrases.data.data as { results?: { documents?: Array<{ keyPhrases: string[] }> } })
          ?.results?.documents?.[0]?.keyPhrases ?? [];
        return (
          <Card className="mt-6">
            <h2 className="text-lg font-semibold dark:text-white mb-4">Key Phrases ({phrases.length})</h2>
            {phrases.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No key phrases found.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {phrases.map((p, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm border border-blue-100 dark:border-blue-800">
                    {p}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Elapsed: {keyPhrases.data.elapsed_ms}ms · Request: {keyPhrases.data.request_id}</p>
          </Card>
        );
      })()}

      {/* Detect Results */}
      {tab === 'detect' && detect.data && (() => {
        const docs = (detect.data.data as { results?: { documents?: Array<{ detectedLanguage: { name: string; iso6391Name: string; confidenceScore: number } }> } })
          ?.results?.documents ?? [];
        const lang = docs[0]?.detectedLanguage;
        return (
          <Card className="mt-6">
            <h2 className="text-lg font-semibold dark:text-white mb-4">Detected Language</h2>
            {lang ? (
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-violet-600 dark:text-violet-400">{lang.iso6391Name.toUpperCase()}</div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{lang.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Confidence: {(lang.confidenceScore * 100).toFixed(1)}%</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Could not detect language.</p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Elapsed: {detect.data.elapsed_ms}ms · Request: {detect.data.request_id}</p>
          </Card>
        );
      })()}
    </div>
  );
}
