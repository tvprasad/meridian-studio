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
  positive: 'bg-emerald-100 text-emerald-800',
  negative: 'bg-red-100 text-red-800',
  neutral: 'bg-gray-100 text-gray-700',
  mixed: 'bg-amber-100 text-amber-800',
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
        <div className="p-2 rounded-lg bg-violet-50">
          <Languages className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Language Intelligence</h1>
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">AI Lab — Preview</span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Sentiment analysis, entity recognition, key phrase extraction, and language detection.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-8 border-b border-gray-200">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px ${
              tab === id
                ? 'bg-white border border-gray-200 border-b-white text-violet-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="mt-0 rounded-tl-none">
        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Input Text</label>
            <textarea
              rows={5}
              className="block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-violet-500 focus:ring-violet-500 focus:outline-none"
              placeholder="Enter text to analyze…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          {hasNonDetectLanguage && (
            <div className="w-36 shrink-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-violet-500 focus:outline-none"
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
        <Card className="mt-4 border-red-200 bg-red-50">
          <p className="text-red-800 text-sm">{(currentMutation.error as Error).message}</p>
        </Card>
      )}

      {/* Sentiment Results */}
      {tab === 'sentiment' && sentiment.data && (() => {
        const doc = sentiment.data.data.results?.documents?.[0];
        if (!doc) return null;
        return (
          <Card className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Sentiment Result</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${SENTIMENT_COLORS[doc.sentiment] ?? 'bg-gray-100'}`}>
                {doc.sentiment}
              </span>
            </div>
            <div className="flex gap-4 text-sm mb-6">
              {(['positive', 'neutral', 'negative'] as const).map((k) => (
                <div key={k} className="flex-1">
                  <p className="text-gray-500 capitalize mb-1">{k}</p>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${k === 'positive' ? 'bg-emerald-400' : k === 'negative' ? 'bg-red-400' : 'bg-gray-400'}`}
                      style={{ width: `${(doc.confidenceScores[k] * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{(doc.confidenceScores[k] * 100).toFixed(0)}%</p>
                </div>
              ))}
            </div>
            {doc.sentences.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Sentences</p>
                <div className="space-y-2">
                  {doc.sentences.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm p-3 bg-gray-50 rounded-lg">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize shrink-0 ${SENTIMENT_COLORS[s.sentiment] ?? 'bg-gray-100'}`}>
                        {s.sentiment}
                      </span>
                      <p className="text-gray-700">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-4">Elapsed: {sentiment.data.elapsed_ms}ms · Request: {sentiment.data.request_id}</p>
          </Card>
        );
      })()}

      {/* Entity Results */}
      {tab === 'entities' && entities.data && (() => {
        const doc = entities.data.data.results?.documents?.[0];
        if (!doc) return null;
        return (
          <Card className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Entities ({doc.entities.length})</h2>
            {doc.entities.length === 0 ? (
              <p className="text-gray-500 text-sm">No entities detected.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {doc.entities.map((e, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 rounded-lg border border-violet-100">
                    <span className="text-sm font-medium text-violet-900">{e.text}</span>
                    <span className="text-xs text-violet-500 border-l border-violet-200 pl-1.5">{e.category}</span>
                    <span className="text-xs text-violet-400">{(e.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-4">Elapsed: {entities.data.elapsed_ms}ms · Request: {entities.data.request_id}</p>
          </Card>
        );
      })()}

      {/* Key Phrases Results */}
      {tab === 'keyphrases' && keyPhrases.data && (() => {
        const phrases: string[] = (keyPhrases.data.data as { results?: { documents?: Array<{ keyPhrases: string[] }> } })
          ?.results?.documents?.[0]?.keyPhrases ?? [];
        return (
          <Card className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Key Phrases ({phrases.length})</h2>
            {phrases.length === 0 ? (
              <p className="text-gray-500 text-sm">No key phrases found.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {phrases.map((p, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm border border-blue-100">
                    {p}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-4">Elapsed: {keyPhrases.data.elapsed_ms}ms · Request: {keyPhrases.data.request_id}</p>
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
            <h2 className="text-lg font-semibold mb-4">Detected Language</h2>
            {lang ? (
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-violet-600">{lang.iso6391Name.toUpperCase()}</div>
                <div>
                  <p className="font-medium text-gray-900">{lang.name}</p>
                  <p className="text-sm text-gray-500">Confidence: {(lang.confidenceScore * 100).toFixed(1)}%</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Could not detect language.</p>
            )}
            <p className="text-xs text-gray-400 mt-4">Elapsed: {detect.data.elapsed_ms}ms · Request: {detect.data.request_id}</p>
          </Card>
        );
      })()}
    </div>
  );
}
