import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { meridianApi } from '../api/meridian';
import type { QueryResponse } from '../api/types';
import { Send, Settings } from 'lucide-react';

const PROVIDER_LABELS: Record<string, string> = {
  local: 'Local (Ollama)',
  azure: 'Azure OpenAI',
  chroma: 'Local (Chroma)',
};

export function Query() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<QueryResponse | null>(null);

  const { data: health } = useQuery({ queryKey: ['health'], queryFn: meridianApi.health });

  const mutation = useMutation({
    mutationFn: meridianApi.query,
    onSuccess: (data) => setResult(data),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      mutation.mutate(question);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Query Console</h1>
      <p className="text-gray-500 mt-1">Ask a question in plain language — Meridian searches your documents and returns a grounded answer with a confidence score.</p>
      {health && (
        <p className="mt-2 text-xs text-gray-400 flex items-center gap-1.5">
          Configured to use
          <span className="font-medium text-gray-600">{PROVIDER_LABELS[health.llm_provider] ?? health.llm_provider}</span>
          and
          <span className="font-medium text-gray-600">{PROVIDER_LABELS[health.retrieval_provider] ?? health.retrieval_provider}</span>
          —
          <Link to="/settings" className="inline-flex items-center gap-0.5 text-primary-600 hover:text-primary-700 transition-colors">
            <Settings className="w-3 h-3" />
            change in Settings
          </Link>
        </p>
      )}

      <Card className="mt-8">
        <form onSubmit={handleSubmit}>
          <label htmlFor="question" className="block text-sm font-medium text-gray-700">
            Question
          </label>
          <textarea
            id="question"
            rows={3}
            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border p-3"
            placeholder="What's your favorite time of day?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="mt-4 flex justify-end">
            <Button type="submit" loading={mutation.isPending}>
              <Send className="w-4 h-4 mr-2" />
              Query
            </Button>
          </div>
        </form>
      </Card>

      {mutation.isError && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <p className="text-red-800">Error: {(mutation.error as Error).message}</p>
        </Card>
      )}

      {result && (
        <Card className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Response</h2>
            <StatusBadge status={result.status} />
          </div>

          {result.status === 'OK' && (
            <div className="prose prose-sm max-w-none">
              <p>{result.answer}</p>
            </div>
          )}

          {result.status === 'REFUSED' && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">Refusal Reason</p>
              <p className="text-yellow-700 mt-1">{result.refusal_reason}</p>
            </div>
          )}

          <div className="mt-6 border-t pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Confidence</span>
              <span className={`font-semibold tabular-nums ${result.confidence_score >= (result.threshold ?? 0) ? 'text-emerald-600' : 'text-red-500'}`}>
                {(result.confidence_score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
              {/* Thermal gradient fill: red → amber → emerald across the score range */}
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 bg-gradient-to-r from-red-400 via-amber-400 to-emerald-500"
                style={{ width: `${result.confidence_score * 100}%` }}
              />
              {result.threshold != null && (
                <div
                  className="absolute inset-y-0 w-0.5 bg-white/70"
                  style={{ left: `${result.threshold * 100}%` }}
                  title={`Threshold: ${(result.threshold * 100).toFixed(0)}%`}
                />
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>0%</span>
              {result.threshold != null && (
                <span className="text-gray-500">threshold {(result.threshold * 100).toFixed(0)}%</span>
              )}
              <span>100%</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-1">
              <span className="text-gray-500">Trace ID</span>
              <span className="font-mono text-xs text-gray-600">{result.trace_id}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}