// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { meridianApi } from '../api/meridian';
import { Activity, Database, Cpu, Gauge, Thermometer, Settings, Upload } from 'lucide-react';
import { type SettingsResponse } from '../api/types';

const PROVIDER_LABELS: Record<string, string> = {
  local: 'Local (Ollama)',
  azure: 'Azure OpenAI',
  chroma: 'Local (Chroma)',
};

export function Dashboard() {
  const { data: health, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: meridianApi.health,
    refetchInterval: 30000,
  });

  const { data: settings } = useQuery<SettingsResponse>({
    queryKey: ['settings'],
    queryFn: meridianApi.getSettings,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Connecting to API…
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-white/[0.05] rounded-xl border border-gray-200 dark:border-white/10 border-l-4 border-l-gray-200 dark:border-l-gray-700 p-6 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-white dark:bg-white/[0.05] rounded-xl border border-gray-200 dark:border-white/10 p-6 animate-pulse">
          <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-l-4 border-l-red-400">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-700 dark:text-red-400 font-medium">Failed to connect to Meridian API</p>
        </div>
        <p className="text-red-500 dark:text-red-400/80 text-sm mt-1 ml-8">Check that the backend is running at the configured URL.</p>
      </Card>
    );
  }

  const stats = [
    {
      label: 'Status',
      description: 'Pipeline and retrieval health',
      value: health?.status || 'unknown',
      icon: Activity,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      borderColor: 'border-l-emerald-400',
      iconAnimation: 'group-hover:scale-110 group-hover:rotate-6 transition-transform duration-200',
      render: () => {
        const s = health?.status;
        const badge = s === 'healthy' ? 'OK' : s === 'uninitialized' ? 'UNINITIALIZED' : 'error';
        return <StatusBadge status={badge} />;
      },
    },
    {
      label: 'Documents',
      description: 'Documents in the knowledge base',
      value: health?.document_count ?? 0,
      icon: Database,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      borderColor: 'border-l-blue-400',
      iconAnimation: 'group-hover:-translate-y-1 group-hover:scale-110 transition-transform duration-200',
    },
    {
      label: 'LLM Provider',
      description: 'Active answer generation backend',
      value: health?.llm_provider || 'unknown',
      icon: Cpu,
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-50',
      borderColor: 'border-l-violet-400',
      iconAnimation: 'group-hover:rotate-90 transition-transform duration-500',
    },
    {
      label: 'Threshold',
      description: 'Minimum confidence score to accept',
      value: health?.retrieval_threshold?.toFixed(2) || '0.00',
      icon: Gauge,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      borderColor: 'border-l-amber-400',
      iconAnimation: 'group-hover:scale-125 transition-transform duration-200',
    },
    {
      label: 'Temperature',
      description: 'LLM response randomness',
      value: settings?.temperature?.toFixed(1) ?? '0.7',
      icon: Thermometer,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50',
      borderColor: 'border-l-rose-400',
      iconAnimation: 'group-hover:scale-110 group-hover:-translate-y-0.5 transition-transform duration-200',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">A live snapshot of your Meridian deployment — pipeline status, knowledge base size, and active providers.</p>
      {health && (
        <p className="mt-2 text-xs text-gray-400 flex items-center gap-1.5">
          Configured to use
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
        {stats.map(({ label, description, value, icon: Icon, iconColor, iconBg, borderColor, iconAnimation, render }) => (
          <Card key={label} className={`border-l-4 ${borderColor} group`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
                {render ? (
                  <div className="mt-2">{render()}</div>
                ) : (
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">{value}</p>
                )}
              </div>
              <div className={`p-2 rounded-lg ${iconBg}`}>
                <Icon className={`w-5 h-5 ${iconColor} ${iconAnimation}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {health && health.document_count === 0 && (
        <Card className="mt-6 border-l-4 border-l-amber-400">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Upload className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Your knowledge base is empty</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Upload documents through the{' '}
                <Link to="/ingest" className="text-primary-600 dark:text-primary-400 hover:underline">Ingestion Pipeline</Link>
                {' '}to start building your knowledge base. Once indexed, you can query them through Ask Meridian.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="mt-8">
        <h2 className="text-lg font-semibold dark:text-white">Configuration</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Retrieval Provider</dt>
            <dd className="font-medium mt-0.5 dark:text-gray-200">{health?.retrieval_provider}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">LLM Provider</dt>
            <dd className="font-medium mt-0.5 dark:text-gray-200">{health?.llm_provider}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}