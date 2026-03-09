import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { meridianApi } from '../api/meridian';
import type { QueryResponse } from '../api/types';
import { Send, Settings, BrainCircuit, AlertTriangle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  metadata?: QueryResponse;
}

const PROVIDER_LABELS: Record<string, string> = {
  local: 'Local (Ollama)',
  azure: 'Azure OpenAI',
  chroma: 'Local (Chroma)',
};

const EXAMPLE_QUESTIONS = [
  'What topics are covered in the knowledge base?',
  'Summarize the key points from the ingested documents.',
  'What is the main purpose of this system?',
];

function ConfidencePill({ score, threshold }: { score: number; threshold?: number }) {
  const pct = (score * 100).toFixed(1);
  const passes = threshold == null || score >= threshold;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
      passes ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
    }`}>
      {pct}% confidence
    </span>
  );
}

function AssistantMessage({ msg }: { msg: Message }) {
  const isRefused = msg.metadata?.status === 'REFUSED';

  return (
    <div className="flex items-start gap-3 max-w-3xl">
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mt-0.5">
        <BrainCircuit className="w-4 h-4 text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        {isRefused ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl rounded-tl-sm px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs font-medium text-amber-700">Could not answer</span>
            </div>
            <p className="text-sm text-amber-800">{msg.metadata?.refusal_reason ?? 'Retrieval confidence below threshold.'}</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
          </div>
        )}
        {msg.metadata && (
          <div className="flex items-center gap-3 mt-1.5 px-1">
            <ConfidencePill score={msg.metadata.confidence_score} threshold={msg.metadata.threshold} />
            <span className="text-xs text-gray-400 font-mono truncate">{msg.metadata.trace_id}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-2xl bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mt-0.5">
        <BrainCircuit className="w-4 h-4 text-primary-600" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

export function Query() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: health } = useQuery({ queryKey: ['health'], queryFn: meridianApi.health });

  const mutation = useMutation({
    mutationFn: meridianApi.query,
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.status === 'OK' ? (data.answer ?? '') : '',
          metadata: data,
        },
      ]);
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${(err as Error).message}` },
      ]);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mutation.isPending]);

  const handleSubmit = () => {
    const q = input.trim();
    if (!q || mutation.isPending) return;
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');
    mutation.mutate(q);
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Query Console</h1>
        <p className="text-gray-500 mt-1">Ask questions in plain language — Meridian searches your documents and returns a grounded answer.</p>
        {health && (
          <p className="mt-2 text-xs text-gray-400 flex items-center gap-1.5">
            Using
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
      </div>

      {/* Messages area */}
      <div className="flex-1 mt-6 overflow-y-auto min-h-[400px]">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-4">
              <BrainCircuit className="w-7 h-7 text-primary-500" />
            </div>
            <h3 className="text-gray-700 font-medium">Ask anything about your documents</h3>
            <p className="text-sm text-gray-400 mt-1 mb-6">Meridian will search the knowledge base and ground its answer in your content.</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors bg-white"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 pb-4">
            {messages.map((msg, i) =>
              msg.role === 'user'
                ? <UserMessage key={i} content={msg.content} />
                : <AssistantMessage key={i} msg={msg} />
            )}
            {mutation.isPending && <ThinkingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 mt-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          className="block w-full resize-none rounded-2xl px-4 pt-3 pb-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
          placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={mutation.isPending}
        />
        <div className="flex items-center justify-end px-3 pb-2.5">
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || mutation.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
