import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { meridianApi, type ChatMessage } from '../api/meridian';
import type { QueryResponse } from '../api/types';
import {
  Send, Settings, BrainCircuit, AlertTriangle, MessageCircle,
  RotateCcw, Copy, Check, WifiOff,
} from 'lucide-react';

// ── Types & Constants ────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
  metadata?: QueryResponse;
}

const STORAGE_KEY = 'meridian-chat-history';

const PROVIDER_LABELS: Record<string, string> = {
  local: 'Local (Ollama)',
  azure: 'Azure OpenAI',
  chroma: 'Local (Chroma)',
};

const FALLBACK_QUESTIONS = [
  'What topics are covered in the knowledge base?',
  'Summarize the key points from the ingested documents.',
  'What is the main purpose of this system?',
  'How do I rollback a deployment?',
];

const FOLLOW_UP_PROMPTS = [
  'Tell me more about this',
  'Can you give me an example?',
  'What are the key takeaways?',
  'How does this compare to alternatives?',
];

// ── Small Components ─────────────────────────────────────────────────────────

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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy answer"
      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function OfflineBanner() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Unable to reach Meridian API. Check your connection or verify the backend is running.</span>
    </div>
  );
}

// ── Message Components ───────────────────────────────────────────────────────

function AssistantMessage({ msg, isLatest, onSuggestionClick }: {
  msg: Message;
  isLatest: boolean;
  onSuggestionClick: (q: string) => void;
}) {
  const isRefused = msg.metadata?.status === 'REFUSED';
  const showFollowUps = isLatest && !isRefused;
  const threshold = msg.metadata?.threshold;
  const score = msg.metadata?.confidence_score;

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
            {score != null && threshold != null && (
              <p className="text-xs text-amber-600 mt-2">
                Confidence was {(score * 100).toFixed(1)}% — the minimum threshold is {(threshold * 100).toFixed(0)}%.
                Try rephrasing with more specific terms or ask about a different topic.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="text-sm text-gray-800 leading-relaxed prose prose-sm prose-gray max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
            {showFollowUps && (
              <div className="flex flex-col items-end gap-2 mt-4">
                <div className="flex items-center gap-1.5 mr-1">
                  <MessageCircle className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-400">Keep the conversation going:</p>
                </div>
                {FOLLOW_UP_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => onSuggestionClick(q)}
                    className="text-left text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm border border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-colors shadow-sm cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {msg.metadata && (
          <div className="flex items-center gap-3 mt-1.5 px-1">
            <ConfidencePill score={msg.metadata.confidence_score} threshold={msg.metadata.threshold} />
            <span className="text-xs text-gray-400 font-mono truncate">{msg.metadata.trace_id}</span>
            {msg.content && <CopyButton text={msg.content} />}
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

// ── Main Component ───────────────────────────────────────────────────────────

export function Query() {
  // Load persisted chat history from localStorage
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Persist messages to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const { data: health, isError: isHealthError } = useQuery({
    queryKey: ['health'],
    queryFn: meridianApi.health,
  });

  const { data: staticQuestions } = useQuery({
    queryKey: ['example-questions'],
    queryFn: async () => {
      const res = await fetch('/example-questions.json');
      if (!res.ok) return null;
      return res.json() as Promise<string[]>;
    },
    staleTime: Infinity,
  });

  const exampleQuestions = health?.suggested_questions ?? staticQuestions ?? FALLBACK_QUESTIONS;

  const mutation = useMutation({
    mutationFn: ({ question, history }: { question: string; history?: ChatMessage[] }) =>
      meridianApi.query(question, history),
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

  const handleSubmit = useCallback(() => {
    const q = input.trim();
    if (!q || mutation.isPending) return;

    const history: ChatMessage[] = messages
      .filter((m) => m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');
    mutation.mutate({ question: q, history: history.length ? history : undefined });
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, messages, mutation]);

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    localStorage.removeItem(STORAGE_KEY);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  // Global keyboard shortcut: Ctrl+K to focus chat input
  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, []);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Ask Meridian</h1>
          {!isEmpty && (
            <button
              onClick={handleNewChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New chat
            </button>
          )}
        </div>
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

      {/* Offline banner */}
      {isHealthError && (
        <div className="shrink-0 mt-4">
          <OfflineBanner />
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 mt-6 overflow-y-auto min-h-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-4">
              <BrainCircuit className="w-7 h-7 text-primary-500" />
            </div>
            <h3 className="text-gray-700 font-medium">Ask anything about your documents</h3>
            <p className="text-sm text-gray-400 mt-1 mb-6">Meridian will search the knowledge base and ground its answer in your content.</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {exampleQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors bg-white"
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-300 mt-8">
              <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-400 font-mono text-[10px]">Ctrl+K</kbd>
              {' '}to focus input
            </p>
          </div>
        ) : (
          <div className="space-y-5 pb-4">
            {messages.map((msg, i) => {
              const isLatest = i === messages.length - 1;
              const handleChipClick = (q: string) => { setInput(q); textareaRef.current?.focus(); };

              if (msg.role === 'user') return <UserMessage key={i} content={msg.content} />;

              return (
                <div key={i}>
                  <AssistantMessage
                    msg={msg}
                    isLatest={isLatest}
                    onSuggestionClick={handleChipClick}
                  />
                  {isLatest && msg.metadata?.status === 'REFUSED' && exampleQuestions.length > 0 && (
                    <div className="flex flex-col items-end gap-2 mt-4">
                      <p className="text-xs text-gray-400 mr-1">Try one of these instead:</p>
                      {exampleQuestions.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleChipClick(q)}
                          className="max-w-2xl text-left text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm border border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-colors shadow-sm cursor-pointer"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
          placeholder="Ask a question… (Enter to send, Shift+Enter for new line, Esc to clear)"
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

      {/* Disclaimer */}
      <p className="shrink-0 text-center text-[10px] text-gray-400 mt-2 leading-relaxed">
        AI-generated, document-grounded answers. Useful as a co-pilot, not a replacement for your judgment.
      </p>
    </div>
  );
}
