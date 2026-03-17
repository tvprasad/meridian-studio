// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useEffect, useState, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { meridianApi } from '../api/meridian';
import { config } from '../config';
import { type SettingsResponse } from '../api/types';
import { CheckCircle, AlertCircle, BrainCircuit, Database, SlidersHorizontal, Thermometer, Languages, Eye, AudioLines, FileText, Loader2, Copy, Check, Link, Plug, MessageSquare, ChevronRight } from 'lucide-react';

const settingsSchema = z.object({
  llm_provider: z.enum(['local', 'azure']),
  retrieval_provider: z.enum(['chroma', 'azure']),
  retrieval_threshold: z.number().min(0).max(1),
  temperature: z.number().min(0).max(2),
});

type SettingsForm = z.infer<typeof settingsSchema>;

function toFormValues(s: SettingsResponse | undefined): SettingsForm {
  return {
    llm_provider: (s?.llm_provider as SettingsForm['llm_provider']) ?? 'local',
    retrieval_provider: (s?.retrieval_provider as SettingsForm['retrieval_provider']) ?? 'chroma',
    retrieval_threshold: s?.retrieval_threshold ?? 0.6,
    temperature: s?.temperature ?? 0.7,
  };
}

// ── Copy-to-clipboard button ─────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
      title={`Copy ${label ?? 'to clipboard'}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : (label ?? 'Copy')}
    </button>
  );
}

// ── Connection Details card ──────────────────────────────────────────────────

const CLAUDE_DESKTOP_CONFIG = (mcpUrl: string) =>
  JSON.stringify(
    {
      mcpServers: {
        meridian: {
          url: `${mcpUrl}/mcp`,
          headers: {
            Authorization: 'Bearer <YOUR_MCP_API_KEY>',
          },
        },
      },
    },
    null,
    2,
  );

const SK_PLUGIN_CONFIG = (apiUrl: string) =>
  `from integrations.semantic_kernel import MeridianPlugin

plugin = MeridianPlugin(
    base_url="${apiUrl}",
    api_key="<YOUR_API_KEY>",
)
kernel.add_plugin(plugin, plugin_name="meridian")`;

function ConnectionDetails() {
  const mcpUrl = config.mcpBaseUrl;
  const apiUrl = config.apiBaseUrl;

  const { data: mcpStatus } = useQuery({
    queryKey: ['mcp-health'],
    queryFn: meridianApi.mcpHealth,
    refetchInterval: 30_000,
  });

  return (
    <Card className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Plug className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        <h2 className="text-lg font-semibold dark:text-white">Connection Details</h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 -mt-2 mb-5">
        Endpoint URLs and configuration snippets for connecting external agents and clients to Meridian.
      </p>

      {/* Endpoint URLs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-white/10 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">API Endpoint</p>
              <p className="text-sm font-mono text-gray-900 dark:text-white truncate">{apiUrl}</p>
            </div>
          </div>
          <CopyButton text={apiUrl} label="URL" />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-white/10 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">MCP Server</p>
              <p className="text-sm font-mono text-gray-900 dark:text-white truncate">{mcpUrl}/mcp</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1.5 text-xs">
              <span className={`w-2 h-2 rounded-full ${mcpStatus?.reachable ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className={mcpStatus?.reachable ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
                {mcpStatus === undefined ? 'Checking...' : mcpStatus.reachable ? 'Reachable' : 'Unreachable'}
              </span>
            </span>
            <CopyButton text={`${mcpUrl}/mcp`} label="URL" />
          </div>
        </div>
      </div>

      {/* Config Snippets */}
      <div className="mt-6 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
              <MessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              Claude Desktop Configuration
            </p>
            <CopyButton text={CLAUDE_DESKTOP_CONFIG(mcpUrl)} label="config" />
          </div>
          <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg p-3 overflow-x-auto text-gray-800 dark:text-gray-200">
            {CLAUDE_DESKTOP_CONFIG(mcpUrl)}
          </pre>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Paste into <span className="font-mono">claude_desktop_config.json</span> and replace <span className="font-mono">&lt;YOUR_MCP_API_KEY&gt;</span> with your MCP API key.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
              <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 12l10 10 10-10L12 2z" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              Semantic Kernel Plugin
            </p>
            <CopyButton text={SK_PLUGIN_CONFIG(apiUrl)} label="config" />
          </div>
          <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg p-3 overflow-x-auto text-gray-800 dark:text-gray-200">
            {SK_PLUGIN_CONFIG(apiUrl)}
          </pre>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Add to your Semantic Kernel agent and replace <span className="font-mono">&lt;YOUR_API_KEY&gt;</span> with your API key.
          </p>
        </div>
      </div>
    </Card>
  );
}

export function Settings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: meridianApi.getSettings,
  });

  // Seed defaultValues from cache so form shows correct values immediately on remount
  const cachedSettings = queryClient.getQueryData<SettingsResponse>(['settings']);

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: toFormValues(cachedSettings),
  });

  // Keep in sync when a background refetch brings in fresh data.
  useEffect(() => {
    if (settings) {
      form.reset(toFormValues(settings));
    }
  }, [settings, form]);

  const mutation = useMutation({
    mutationFn: meridianApi.updateSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      void queryClient.invalidateQueries({ queryKey: ['health'] });
    },
  });

  const threshold = form.watch('retrieval_threshold');
  const temperature = form.watch('temperature');
  const isDirty = form.formState.isDirty;

  const isHosted = !config.apiBaseUrl.includes('localhost');
  const onSubmit = form.handleSubmit((data) => mutation.mutate(data));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Choose your LLM and retrieval providers, adjust the confidence threshold, and review Cognitive AI service status.</p>
        </div>
        {isDirty && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-full ring-1 ring-amber-200 dark:ring-amber-800">
            Unsaved changes
          </span>
        )}
      </div>

      <form onSubmit={onSubmit}>
        <Card className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold dark:text-white">Provider Configuration</h2>
            {isLoading && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading...
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2 mb-5">Changes apply immediately but are reset on server restart. Set environment variables for persistent configuration.</p>

          <div className="space-y-6">
            <div>
              <label htmlFor="llm_provider" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
                <BrainCircuit className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                LLM Provider
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">The large language model that generates answers from retrieved context.</p>
              <select
                id="llm_provider"
                {...form.register('llm_provider')}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-white/15 shadow-sm focus:border-primary-500 focus:ring-primary-500 border p-2 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="local" disabled={isHosted}>Local (Ollama){isHosted ? ' — unavailable in hosted mode' : ''}</option>
                <option value="azure">Azure OpenAI</option>
              </select>
            </div>

            <div>
              <label htmlFor="retrieval_provider" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
                <Database className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                Retrieval Provider
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">The vector store used to find relevant document passages for each query.</p>
              <select
                id="retrieval_provider"
                {...form.register('retrieval_provider')}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-white/15 shadow-sm focus:border-primary-500 focus:ring-primary-500 border p-2 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="chroma" disabled={isHosted}>Local (Chroma){isHosted ? ' — unavailable in hosted mode' : ''}</option>
                <option value="azure">Azure AI Search</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="retrieval_threshold" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
                  <SlidersHorizontal className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  Retrieval Threshold
                </label>
                <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                  {(threshold * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Minimum similarity score for a passage to be included. Higher values mean stricter matching — the model may refuse to answer if no passages meet the threshold.</p>
              <input
                id="retrieval_threshold"
                type="range"
                min="0"
                max="1"
                step="0.05"
                {...form.register('retrieval_threshold', { valueAsNumber: true })}
                className="mt-2 block w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="temperature" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
                  <Thermometer className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  Temperature
                </label>
                <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                  {temperature.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Controls LLM response randomness. Lower values produce focused, deterministic answers. Higher values increase creativity and variation.</p>
              <input
                id="temperature"
                type="range"
                min="0"
                max="2"
                step="0.1"
                {...form.register('temperature', { valueAsNumber: true })}
                className="mt-2 block w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                <span>0.0 Precise</span>
                <span>1.0 Balanced</span>
                <span>2.0 Creative</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {mutation.isSuccess && (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Settings saved</span>
                </>
              )}
              {mutation.isError && (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-600 dark:text-red-400">{(mutation.error as Error).message}</span>
                </>
              )}
            </div>
            <div className="flex gap-3">
              {isDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { form.reset(); mutation.reset(); }}
                >
                  Discard
                </Button>
              )}
              <Button type="submit" loading={mutation.isPending} disabled={!isDirty}>
                Save changes
              </Button>
            </div>
          </div>
        </Card>
      </form>

      <ConnectionDetails />

      <Card className="mt-6">
        <h2 className="text-lg font-semibold dark:text-white mb-4">Cognitive AI Services</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Standalone Azure AI capabilities available alongside the RAG engine.
          These services are configured via backend environment variables and do not affect query behavior.
        </p>
        <ul className="mt-4 space-y-1 text-sm">
          {[
            { to: '/language', icon: Languages, label: 'Language Service', desc: 'Sentiment, entities, key phrases' },
            { to: '/vision', icon: Eye, label: 'Vision Service', desc: 'Image analysis, captions, OCR' },
            { to: '/speech', icon: AudioLines, label: 'Speech Service', desc: 'Transcription and text-to-speech' },
            { to: '/document', icon: FileText, label: 'Document Intelligence', desc: 'Form recognition, table extraction' },
          ].map(({ to, icon: Icon, label, desc }) => (
            <li key={to}>
              <RouterLink
                to={to}
                className="flex items-center gap-2 px-3 py-2 -mx-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
              >
                <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-gray-900 dark:text-gray-200">{label}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{desc}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </RouterLink>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
