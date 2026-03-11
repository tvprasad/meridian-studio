import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { meridianApi } from '../api/meridian';
import type { AgentQueryResponse, AgentStep } from '../api/types';
import {
  Send, Bot, Wrench, Clock, ChevronDown, ChevronRight,
  Copy, Check, AlertCircle, Loader2, Fingerprint, RotateCcw,
  MessageCircle, ThumbsUp, ThumbsDown,
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

const AGENT_FEEDBACK_KEY = 'meridian-agent-feedback';

type Feedback = 'up' | 'down' | null;

function loadFeedback(): Record<string, Feedback> {
  try {
    const stored = localStorage.getItem(AGENT_FEEDBACK_KEY);
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
  localStorage.setItem(AGENT_FEEDBACK_KEY, JSON.stringify(all));
}

function FeedbackButtons({ traceId }: { traceId: string }) {
  const [feedback, setFeedback] = useState<Feedback>(() => loadFeedback()[traceId] ?? null);

  const toggle = (value: 'up' | 'down') => {
    const next = feedback === value ? null : value;
    setFeedback(next);
    saveFeedback(traceId, next);
  };

  return (
    <span className="inline-flex items-center gap-1">
      <button
        onClick={() => toggle('up')}
        title="Helpful"
        className={`p-0.5 rounded transition-colors ${
          feedback === 'up'
            ? 'text-emerald-500'
            : 'text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400'
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
            : 'text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400'
        }`}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}

const DEMO_QUESTION = 'Why are login requests failing for region us-east?';

const EXAMPLE_QUESTIONS = [
  DEMO_QUESTION,
  'What caused the spike in 5xx errors yesterday?',
  'Are there any open P1 incidents affecting payments?',
  'Summarize recent deployment failures in production',
];

const FOLLOW_UP_PROMPTS = [
  'Dig deeper into the root cause',
  'What is the current status?',
  'Are other regions affected?',
  'What should we do next?',
];

// ── Step Components ──────────────────────────────────────────────────────────

function StepCard({ step, isLast }: { step: AgentStep; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0 z-10">
          <Wrench className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-violet-200 dark:bg-violet-800/50 mt-1" />}
      </div>

      {/* Step content */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
            Step {step.step}
          </span>
          <code className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-mono">
            {step.tool}
          </code>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {step.elapsed_ms.toLocaleString()}ms
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {expanded ? 'Hide details' : 'Show details'}
        </button>

        {expanded && (
          <div className="mt-2 space-y-2">
            {step.input && Object.keys(step.input).length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold mb-1">Input</p>
                <pre className="text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-2 overflow-x-auto text-gray-600 dark:text-gray-400">
                  {JSON.stringify(step.input, null, 2)}
                </pre>
              </div>
            )}
            {step.output_preview && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold mb-1">Output preview</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-2">
                  {step.output_preview}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReasoningTimeline({ steps }: { steps: AgentStep[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-violet-200 dark:border-violet-800/50 rounded-xl overflow-hidden bg-violet-50/50 dark:bg-violet-900/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-colors"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <span className="font-medium">Reasoning steps</span>
        <span className="text-violet-400 dark:text-violet-500">
          {steps.length} tool{steps.length !== 1 ? 's' : ''} called
        </span>
      </button>
      {open && (
        <div className="px-3 pb-2 border-t border-violet-200 dark:border-violet-800/50 pt-3">
          {steps.map((step, i) => (
            <StepCard key={step.step} step={step} isLast={i === steps.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Answer Display ───────────────────────────────────────────────────────────

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

function AgentAnswer({ result, isLatest, onFollowUpClick }: {
  result: AgentQueryResponse;
  isLatest: boolean;
  onFollowUpClick: (q: string) => void;
}) {
  const isOk = result.status === 'OK';
  const showFollowUps = isLatest && isOk;

  return (
    <div className="space-y-4">
      {/* Final answer first — faster time-to-value */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mt-0.5">
          <Bot className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          {isOk ? (
            <div className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed prose prose-sm prose-gray dark:prose-invert max-w-none">
                <ReactMarkdown>{result.answer}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-xs font-medium text-red-700 dark:text-red-400">Agent failed</span>
              </div>
              <p className="text-sm text-red-800 dark:text-red-300">{result.answer}</p>
            </div>
          )}
          <div className="flex items-center gap-4 mt-1.5 px-1">
            {result.answer && <CopyButton text={result.answer} />}
            <FeedbackButtons traceId={result.trace_id} />
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {(result.elapsed_ms / 1000).toFixed(1)}s total
            </span>
            <span className="text-[11px] text-gray-400">
              {result.steps_taken} step{result.steps_taken !== 1 ? 's' : ''}
            </span>
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Fingerprint className="w-3 h-3" />
              {result.trace_id}
            </span>
          </div>
        </div>
      </div>

      {/* Reasoning timeline — collapsed by default, expandable for deep-dive */}
      {result.steps.length > 0 && <ReasoningTimeline steps={result.steps} />}

      {/* Follow-up prompts */}
      {showFollowUps && (
        <div className="flex flex-wrap gap-2 justify-center">
          <div className="w-full flex items-center justify-center gap-1.5 mb-1">
            <MessageCircle className="w-3 h-3 text-gray-400 dark:text-gray-500" />
            <p className="text-xs text-gray-400 dark:text-gray-500">Keep investigating:</p>
          </div>
          {FOLLOW_UP_PROMPTS.map((q) => (
            <button
              key={q}
              onClick={() => onFollowUpClick(q)}
              className="text-sm px-4 py-2.5 rounded-2xl border border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-colors shadow-sm cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Thinking Indicator ───────────────────────────────────────────────────────

function ThinkingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mt-0.5">
        <Bot className="w-4 h-4 text-violet-600 dark:text-violet-400" />
      </div>
      <div className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Agent is reasoning...</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

interface ConversationEntry {
  question: string;
  result?: AgentQueryResponse;
  error?: string;
}

export function AgentQuery() {
  const [entries, setEntries] = useState<ConversationEntry[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mutation = useMutation({
    mutationFn: (question: string) => meridianApi.agentQuery(question),
    onSuccess: (data) => {
      setEntries((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], result: data };
        return updated;
      });
    },
    onError: (err) => {
      setEntries((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          error: (err as Error).message,
        };
        return updated;
      });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, mutation.isPending]);

  const handleSubmit = useCallback(() => {
    const q = input.trim();
    if (!q || mutation.isPending) return;

    setEntries((prev) => [...prev, { question: q }]);
    setInput('');
    mutation.mutate(q);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, mutation]);

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

  const handleReset = useCallback(() => {
    setEntries([]);
    setInput('');
    mutation.reset();
    textareaRef.current?.focus();
  }, [mutation]);

  // Ctrl+K / Cmd+K shortcut for new query
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleReset]);

  const isEmpty = entries.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="shrink-0 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Operations Agent</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Ask operational questions — the agent uses ReAct reasoning to search incidents, logs, and metrics, then synthesizes an answer.
          </p>
        </div>
        {!isEmpty && (
          <button
            onClick={handleReset}
            title="New query (Ctrl+K)"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/15 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shrink-0 mt-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New query
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 mt-6 overflow-y-auto min-h-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-full bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center mb-4">
              <Bot className="w-7 h-7 text-violet-500 dark:text-violet-400" />
            </div>
            <h3 className="text-gray-700 dark:text-gray-200 font-medium">Ask about incidents, alerts, and operations</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-6">
              The agent reasons step-by-step, calling tools to investigate before answering.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mb-8">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/15 text-gray-600 dark:text-gray-300 hover:border-violet-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors bg-white dark:bg-white/5"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input bar — centered in empty state */}
            <div className="w-full max-w-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/15 rounded-2xl shadow-md focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 dark:focus-within:ring-violet-900/30 focus-within:shadow-lg transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                className="block w-full resize-none px-4 pt-3.5 pb-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none bg-transparent"
                placeholder="Ask an operations question..."
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                disabled={mutation.isPending}
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
                  disabled={!input.trim() || mutation.isPending}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Send (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-3">
              AI-generated answers based on tool-assisted reasoning. Verify critical operational decisions independently.
            </p>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {entries.map((entry, i) => (
              <div key={i} className="space-y-4">
                {/* User question */}
                <div className="flex justify-end">
                  <div className="max-w-2xl bg-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{entry.question}</p>
                  </div>
                </div>

                {/* Agent response */}
                {entry.result && (
                  <AgentAnswer
                    result={entry.result}
                    isLatest={i === entries.length - 1}
                    onFollowUpClick={(q) => { setInput(q); textareaRef.current?.focus(); }}
                  />
                )}

                {/* Error */}
                {entry.error && (
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mt-0.5">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-sm text-red-800 dark:text-red-300">{entry.error}</p>
                    </div>
                  </div>
                )}

                {/* Thinking (only on last entry if still pending) */}
                {i === entries.length - 1 && mutation.isPending && !entry.result && !entry.error && (
                  <ThinkingIndicator />
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar — bottom-pinned during conversation */}
      {!isEmpty && (
        <>
          <div className="shrink-0 mt-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/15 rounded-2xl shadow-md focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 dark:focus-within:ring-violet-900/30 focus-within:shadow-lg transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              className="block w-full resize-none px-4 pt-3.5 pb-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none bg-transparent"
              placeholder="Ask a follow-up..."
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={mutation.isPending}
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
                disabled={!input.trim() || mutation.isPending}
                className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Send (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="shrink-0 text-center text-[10px] text-gray-400 dark:text-gray-600 mt-2 leading-relaxed">
            AI-generated answers based on tool-assisted reasoning. Verify critical operational decisions independently.
          </p>
        </>
      )}
    </div>
  );
}
