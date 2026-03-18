// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { meridianApi, type ChatMessage } from '../api/meridian';
import type { QueryResponse } from '../api/types';
import {
  Send, Settings, BrainCircuit, AlertTriangle, MessageCircle,
  RotateCcw, Copy, Check, WifiOff, ChevronDown, ChevronRight,
  FileText, ShieldCheck, ShieldAlert, Fingerprint,
  ThumbsUp, ThumbsDown, HelpCircle,
} from 'lucide-react';

// ── Types & Constants ────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
  metadata?: QueryResponse;
}

const STORAGE_KEY = 'meridian-chat-history';
const FEEDBACK_KEY = 'meridian-feedback';

const PROVIDER_LABELS: Record<string, string> = {
  local: 'Local (Ollama)',
  azure: 'Azure OpenAI',
  chroma: 'Local (Chroma)',
};

const FALLBACK_QUESTIONS = [
  'What topics are covered in the knowledge base?',
  'How do I reset my password?',
  'What is our company\'s policy on using generative AI tools?',
  'How do I get access to Azure OpenAI for my project?',
  'What are the approved AI tools for internal use?',
  'What data classification rules apply to AI model training?',
];

const FOLLOW_UP_PROMPTS = [
  'Tell me more about this',
  'Can you give me an example?',
  'What are the key takeaways?',
  'How does this compare to alternatives?',
];

// ── Guide ────────────────────────────────────────────────────────────────────

function QueryGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span className="font-medium">How Ask Meridian works</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-3 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl p-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          <dl className="space-y-2">
            <div>
              <dt className="font-medium text-gray-700 dark:text-gray-300">Retrieval</dt>
              <dd>Your question is converted to an embedding and matched against the ingested knowledge base using vector search. The most relevant document chunks are retrieved with similarity scores.</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700 dark:text-gray-300">Governance gate</dt>
              <dd>If the best retrieval score falls below the confidence threshold (configurable in Settings), the system refuses to answer rather than guessing. This is a deliberate governance decision — not an error.</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700 dark:text-gray-300">Grounded generation</dt>
              <dd>When confidence passes the threshold, the LLM generates an answer grounded strictly in the retrieved documents, with source citations. It will not fabricate information beyond what was retrieved.</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700 dark:text-gray-300">Multi-turn context</dt>
              <dd>Conversation history is sent with each question, so follow-up queries like "tell me more" or "what about X?" are interpreted in context of the previous exchange.</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

// ── Small Components ─────────────────────────────────────────────────────────

function ConfidencePill({ score, rawScore, threshold }: { score: number; rawScore?: number | null; threshold?: number }) {
  const pct = (score * 100).toFixed(1);
  const passes = threshold == null || score >= threshold;
  const isCalibrated = rawScore != null && Math.abs(rawScore - score) > 0.001;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
      passes ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
    }`}>
      {isCalibrated ? (
        <span title={`Raw: ${(rawScore * 100).toFixed(1)}% — Calibrated: ${pct}%`}>
          {(rawScore * 100).toFixed(1)}% → {pct}%
        </span>
      ) : (
        <>{pct}%{threshold != null ? ` / ${(threshold * 100).toFixed(0)}% threshold` : ' confidence'}</>
      )}
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
      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

type Feedback = 'up' | 'down' | null;

function loadFeedback(): Record<string, Feedback> {
  try {
    const stored = localStorage.getItem(FEEDBACK_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveFeedback(traceId: string, value: Feedback) {
  const all = loadFeedback();
  if (value) {
    all[traceId] = value;
  } else {
    delete all[traceId];
  }
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all));
}

function FeedbackButtons({ traceId }: { traceId: string }) {
  const [feedback, setFeedback] = useState<Feedback>(() => loadFeedback()[traceId] ?? null);

  const toggle = (value: 'up' | 'down') => {
    const next = feedback === value ? null : value;
    setFeedback(next);
    saveFeedback(traceId, next);
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[11px] text-gray-400 dark:text-gray-500">Helpful?</span>
      <button
        onClick={() => toggle('up')}
        title="Helpful"
        className={`p-0.5 rounded transition-colors ${
          feedback === 'up'
            ? 'text-emerald-500'
            : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
        }`}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => toggle('down')}
        title="Not helpful"
        className={`p-0.5 rounded transition-colors ${
          feedback === 'down'
            ? 'text-red-500'
            : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
        }`}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}

function RetrievalScoreBar({ score, threshold, index }: { score: number; threshold: number; index: number }) {
  const pct = score * 100;
  const threshPct = threshold * 100;
  const passes = score >= threshold;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-20 shrink-0">
        <FileText className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-500 dark:text-gray-400">Chunk {index + 1}</span>
      </div>
      <div className="flex-1 relative h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        {/* Threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-gray-400 z-10"
          style={{ left: `${threshPct}%` }}
          title={`Threshold: ${threshPct.toFixed(0)}%`}
        />
        {/* Score bar */}
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            passes
              ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
              : 'bg-gradient-to-r from-red-300 to-red-400'
          }`}
          style={{ width: `${pct}%` }}
        />
        {/* Threshold label */}
        <span
          className="absolute top-0.5 text-[9px] text-gray-500 pointer-events-none"
          style={{ left: `${threshPct + 1}%` }}
        >
          {threshPct.toFixed(0)}%
        </span>
      </div>
      <span className={`text-xs font-medium w-14 text-right ${passes ? 'text-emerald-600' : 'text-red-500'}`}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

function RetrievalPanel({ metadata, defaultOpen }: { metadata: QueryResponse; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const scores = metadata.retrieval_scores ?? [];
  const threshold = metadata.threshold ?? 0.6;
  const passing = scores.filter((s) => s >= threshold).length;
  const isOk = metadata.status === 'OK';

  if (scores.length === 0) return null;

  return (
    <div className="mt-2 border border-gray-150 dark:border-white/10 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-white/[0.03]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <span className="font-medium">Citations</span>
        <span className="text-gray-400">
          {scores.length} chunk{scores.length !== 1 ? 's' : ''} retrieved
        </span>
        <span className="ml-auto flex items-center gap-1">
          {isOk ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          )}
          <span className={isOk ? 'text-emerald-600' : 'text-red-500'}>
            {passing}/{scores.length} above threshold
          </span>
        </span>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2 border-t border-gray-100 dark:border-white/10">
          {/* Trackbars */}
          <div className="space-y-1.5 pt-2">
            {scores.map((score, i) => (
              <RetrievalScoreBar key={i} score={score} threshold={threshold} index={i} />
            ))}
          </div>
          {/* Summary stats */}
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100 dark:border-white/10 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Fingerprint className="w-3 h-3" />
              {metadata.trace_id}
            </span>
            <span>
              Best: {(Math.max(...scores) * 100).toFixed(1)}%
            </span>
            <span>
              Avg: {((scores.reduce((a, b) => a + b, 0) / scores.length) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function OfflineBanner() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-sm text-amber-700 dark:text-amber-400">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Unable to reach Meridian API. Check your connection or verify the backend is running.</span>
    </div>
  );
}

// ── Message Components ───────────────────────────────────────────────────────

function AssistantMessage({ msg, isLatest, isStreamingMsg, onSuggestionClick }: {
  msg: Message;
  isLatest: boolean;
  isStreamingMsg?: boolean;
  onSuggestionClick: (q: string) => void;
}) {
  const isRefused = msg.metadata?.status === 'REFUSED';
  const showFollowUps = isLatest && !isRefused && !isStreamingMsg;
  const threshold = msg.metadata?.threshold;
  const score = msg.metadata?.confidence_score;
  const rawScore = msg.metadata?.raw_confidence;
  const isCalibrated = rawScore != null && score != null && Math.abs(rawScore - score) > 0.001;

  return (
    <div>
      <div className="flex items-start gap-3 max-w-3xl">
        <div className="shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mt-0.5">
          <BrainCircuit className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          {isRefused ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {score != null && score < 0.2 ? 'Outside the knowledge base' : 'Not enough evidence to answer'}
                </span>
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-300">{msg.metadata?.refusal_reason ?? 'Retrieval confidence below threshold.'}</p>
              {score != null && threshold != null && (
                <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-2">
                  {isCalibrated
                    ? `Raw confidence was ${(rawScore * 100).toFixed(1)}%, calibrated to ${(score * 100).toFixed(1)}%`
                    : `Confidence was ${(score * 100).toFixed(1)}%`}
                  {` — the minimum threshold is ${(threshold * 100).toFixed(0)}%.`}
                  {' '}Try rephrasing with more specific terms, or{' '}
                  <Link to="/ingest" className="underline hover:text-amber-700 dark:hover:text-amber-300">ingest more documents</Link>
                  {' '}to broaden coverage.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed prose prose-sm prose-gray dark:prose-invert max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
                {isStreamingMsg && <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse ml-0.5 align-text-bottom rounded-sm" />}
              </div>
            </div>
          )}
          {msg.metadata && (
            <div className="flex items-center gap-3 mt-1.5 px-1">
              <ConfidencePill score={msg.metadata.confidence_score} rawScore={msg.metadata.raw_confidence} threshold={msg.metadata.threshold} />
              {msg.content && !isStreamingMsg && <CopyButton text={msg.content} />}
              {!isStreamingMsg && <FeedbackButtons traceId={msg.metadata.trace_id} />}
            </div>
          )}
        </div>
      </div>
      {msg.metadata && (
        <div className="max-w-3xl pl-11">
          <RetrievalPanel metadata={msg.metadata} defaultOpen={msg.metadata.status === 'REFUSED'} />
        </div>
      )}
      {showFollowUps && (
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          <div className="w-full flex items-center justify-center gap-1.5 mb-1">
            <MessageCircle className="w-3 h-3 text-gray-400 dark:text-gray-500" />
            <p className="text-xs text-gray-400 dark:text-gray-500">Keep the conversation going:</p>
          </div>
          {FOLLOW_UP_PROMPTS.map((q) => (
            <button
              key={q}
              onClick={() => onSuggestionClick(q)}
              className="text-sm px-4 py-2.5 rounded-2xl border border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-colors shadow-sm cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}
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
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mt-0.5">
        <BrainCircuit className="w-4 h-4 text-primary-600 dark:text-primary-400" />
      </div>
      <div className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
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

  const [isStreaming, setIsStreaming] = useState(false);

  const streamQuery = useCallback(async (question: string, history?: ChatMessage[]) => {
    setIsStreaming(true);
    try {
      // Add a placeholder assistant message that we'll update incrementally
      const placeholderIndex = messages.length + 1; // +1 for the user message added before calling this
      let accumulatedText = '';
      let metadata: QueryResponse | undefined;

      for await (const event of meridianApi.queryStream(question, history)) {
        switch (event.type) {
          case 'metadata':
            metadata = {
              status: event.data.status,
              trace_id: event.data.trace_id,
              confidence_score: event.data.confidence_score,
              raw_confidence: event.data.raw_confidence,
              threshold: event.data.threshold,
              retrieval_scores: event.data.retrieval_scores,
            };
            // Add the assistant message with metadata but empty content (tokens incoming)
            setMessages((prev) => {
              const updated = [...prev];
              // Only add if we haven't added the assistant message yet
              if (updated.length === placeholderIndex) {
                updated.push({ role: 'assistant', content: '', metadata });
              }
              return updated;
            });
            break;

          case 'token':
            accumulatedText += event.data.text;
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                updated[lastIdx] = { ...updated[lastIdx], content: accumulatedText };
              }
              return updated;
            });
            break;

          case 'done':
            // Final update — ensure metadata has answer
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].role === 'assistant' && updated[lastIdx].metadata) {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  metadata: { ...updated[lastIdx].metadata!, answer: accumulatedText },
                };
              }
              return updated;
            });
            break;

          case 'error':
            // REFUSED or UNINITIALIZED — render as a single message
            setMessages((prev) => {
              const updated = [...prev];
              const errorResponse: QueryResponse = {
                status: event.data.status,
                trace_id: event.data.trace_id,
                confidence_score: event.data.confidence_score ?? 0,
                raw_confidence: event.data.raw_confidence,
                threshold: event.data.threshold,
                refusal_reason: event.data.refusal_reason,
              };
              // If we already have a placeholder, update it; otherwise add
              if (updated.length > placeholderIndex - 1 && updated[updated.length - 1].role === 'assistant') {
                updated[updated.length - 1] = { role: 'assistant', content: '', metadata: errorResponse };
              } else {
                updated.push({ role: 'assistant', content: '', metadata: errorResponse });
              }
              return updated;
            });
            break;
        }
      }
    } catch {
      // Streaming failed — fall back to non-streaming
      try {
        const data = await meridianApi.query(question, history);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.status === 'OK' ? (data.answer ?? '') : '',
            metadata: data,
          },
        ]);
      } catch (fallbackErr) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${(fallbackErr as Error).message}` },
        ]);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSubmit = useCallback(() => {
    const q = input.trim();
    if (!q || isStreaming) return;

    const history: ChatMessage[] = messages
      .filter((m) => m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');
    streamQuery(q, history.length ? history : undefined);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, messages, isStreaming, streamQuery]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setInput('');
    localStorage.removeItem(STORAGE_KEY);
    textareaRef.current?.focus();
  }, []);

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

  // Global keyboard shortcut: Ctrl+K — new chat (resets conversation) or focuses input
  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (messages.length > 0) {
          handleNewChat();
        } else {
          textareaRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, [messages.length, handleNewChat]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="shrink-0 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ask Meridian</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Ask questions in plain language. Meridian searches your ingested documents, evaluates confidence against a governance threshold, and returns a grounded answer — or explains why it can't.</p>
          {health && (
            <p className="mt-2 text-xs text-gray-400 flex items-center gap-1.5">
              Using
              <span className="font-medium text-gray-600 dark:text-gray-300">{PROVIDER_LABELS[health.llm_provider] ?? health.llm_provider}</span>
              and
              <span className="font-medium text-gray-600 dark:text-gray-300">{PROVIDER_LABELS[health.retrieval_provider] ?? health.retrieval_provider}</span>
              —
              <Link to="/settings" className="inline-flex items-center gap-0.5 text-primary-600 hover:text-primary-700 transition-colors">
                <Settings className="w-3 h-3" />
                change in Settings
              </Link>
            </p>
          )}
          <QueryGuide />
        </div>
        {!isEmpty && (
          <button
            onClick={handleNewChat}
            title="New chat (Ctrl+K)"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/15 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shrink-0 mt-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New chat
          </button>
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
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-4">
              <BrainCircuit className="w-7 h-7 text-primary-500 dark:text-primary-400" />
            </div>
            <h3 className="text-gray-700 dark:text-gray-200 font-medium">Ask anything about your documents</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-6">Meridian will search the knowledge base and ground its answer in your content.</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mb-8">
              {exampleQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/15 text-gray-600 dark:text-gray-300 hover:border-primary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors bg-white dark:bg-white/5"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input bar — centered in empty state */}
            <div className="w-full max-w-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/15 rounded-2xl shadow-md focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 dark:focus-within:ring-primary-900/30 focus-within:shadow-lg transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                className="block w-full resize-none px-4 pt-3.5 pb-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none bg-transparent"
                placeholder="Ask a question..."
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
              />
              <div className="flex items-center justify-between px-3 pb-3">
                <div className="flex items-center gap-2">
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[10px] font-mono text-gray-400">
                    Enter
                  </kbd>
                  <span className="hidden sm:inline text-[10px] text-gray-400 dark:text-gray-500">to send</span>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isStreaming}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Send (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-3">
              AI-generated, document-grounded answers. Useful as a co-pilot, not a replacement for your judgment.
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
                    isStreamingMsg={isLatest && isStreaming}
                    onSuggestionClick={handleChipClick}
                  />
                  {isLatest && msg.metadata?.status === 'REFUSED' && exampleQuestions.length > 0 && (
                    <div className="max-w-3xl pl-11 mt-3">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Try one of these instead:</p>
                      <div className="flex flex-wrap gap-2">
                        {exampleQuestions.map((q) => (
                          <button
                            key={q}
                            onClick={() => handleChipClick(q)}
                            className="text-left text-sm px-4 py-2 rounded-2xl border border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-colors shadow-sm cursor-pointer"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {isStreaming && (messages.length === 0 || messages[messages.length - 1].role === 'user') && <ThinkingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar — bottom-pinned during conversation */}
      {!isEmpty && (
        <>
          <div className="shrink-0 mt-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/15 rounded-2xl shadow-md focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 dark:focus-within:ring-primary-900/30 focus-within:shadow-lg transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              className="block w-full resize-none px-4 pt-3.5 pb-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none bg-transparent"
              placeholder="Ask a follow-up..."
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
            />
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-2">
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[10px] font-mono text-gray-400">
                  Enter
                </kbd>
                <span className="hidden sm:inline text-[10px] text-gray-400 dark:text-gray-500">to send</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isStreaming}
                className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Send (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="shrink-0 text-center text-[10px] text-gray-400 dark:text-gray-600 mt-2 leading-relaxed">
            AI-generated, document-grounded answers. Useful as a co-pilot, not a replacement for your judgment.
          </p>
        </>
      )}
    </div>
  );
}
