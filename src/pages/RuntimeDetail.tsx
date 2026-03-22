// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Copy, Check, Shield, Clock, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { ProvisioningBadge } from '../components/admin/ProvisioningBadge';
import { ProvisioningTimeline } from '../components/admin/ProvisioningTimeline';
import { AdminGuard } from '../components/admin/AdminGuard';
import { runtimesApi, PROVISIONING_TERMINAL } from '../api/runtimes';
import { CLOUD_LABELS } from '../data/provisioningStates';

export function RuntimeDetail() {
  const { runtimeId } = useParams<{ runtimeId: string }>();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: rt, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ['runtime', runtimeId],
    queryFn: () => runtimesApi.get(runtimeId!),
    enabled: !!runtimeId,
  });

  const cancelMutation = useMutation({
    mutationFn: () => runtimesApi.cancel(runtimeId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runtime', runtimeId] });
      queryClient.invalidateQueries({ queryKey: ['runtimes'] });
      setShowCancelConfirm(false);
    },
  });

  const provisionMutation = useMutation({
    mutationFn: () => runtimesApi.provision(runtimeId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runtime', runtimeId] });
    },
  });

  function copyId() {
    navigator.clipboard.writeText(runtimeId!);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  if (isLoading) {
    return (
      <AdminGuard>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </AdminGuard>
    );
  }

  if (error || !rt) {
    return (
      <AdminGuard>
        <Card className="border-l-4 border-l-red-400">
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load runtime {runtimeId}.</p>
          <Link to="/admin/runtimes" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mt-2">
            <ArrowLeft className="w-4 h-4" /> Back to list
          </Link>
        </Card>
      </AdminGuard>
    );
  }

  const isActive = !PROVISIONING_TERMINAL.has(rt.status);
  const canCancel = isActive && rt.status !== 'QUEUED';
  const canProvision = rt.status === 'QUEUED';

  return (
    <AdminGuard>
      <div className="space-y-6">
        <Link to="/admin/runtimes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Runtime Environments
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{rt.name}</h1>
              <ProvisioningBadge status={rt.status} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Created {new Date(rt.created_at).toLocaleString()}
              </span>
              <span>{CLOUD_LABELS[rt.cloud] ?? rt.cloud} / {rt.region}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              {!isFetching && 'Refresh'}
            </button>
            <button
              onClick={copyId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              {rt.id.slice(0, 12)}...
            </button>
            {canProvision && (
              <button
                onClick={() => provisionMutation.mutate()}
                disabled={provisionMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {provisionMutation.isPending ? 'Starting...' : 'Start Provisioning'}
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Cancel confirmation */}
        {showCancelConfirm && (
          <Card className="border-l-4 border-l-red-400">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Cancel provisioning for {rt.name}?</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">This will stop the provisioning process. Partially created resources may need manual cleanup.</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Keep Running
                  </button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Error banner */}
        {rt.error && (
          <Card className="border-l-4 border-l-red-400">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Provisioning Error</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{rt.error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Provisioning timeline */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Provisioning Progress</h2>
          <ProvisioningTimeline currentStatus={rt.status} />
          {isActive && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              Use Refresh to check for progress updates. SSE streaming is planned.
            </p>
          )}
        </Card>

        {/* Two columns: config + metadata */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Configuration</h3>
            <dl className="space-y-2 text-xs">
              {Object.entries(rt.config).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">{key.replace(/_/g, ' ')}</dt>
                  <dd className="font-mono text-gray-700 dark:text-gray-300">{String(val)}</dd>
                </div>
              ))}
              {Object.keys(rt.config).length === 0 && (
                <p className="text-gray-400">No configuration provided.</p>
              )}
            </dl>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Metadata</h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Version</dt>
                <dd className="font-mono text-gray-700 dark:text-gray-300">{rt.version}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Steps</dt>
                <dd className="font-mono text-gray-700 dark:text-gray-300">{rt.step_count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Created By</dt>
                <dd className="font-mono text-gray-700 dark:text-gray-300">{rt.created_by.slice(0, 12)}...</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Last Updated</dt>
                <dd className="text-gray-700 dark:text-gray-300">{new Date(rt.updated_at).toLocaleString()}</dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* Progress log */}
        {rt.steps.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Progress Log</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-0">
                {rt.steps.map((step) => (
                  <div key={step.step_number} className="relative pl-10 pb-3">
                    <div className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 ${
                      step.error
                        ? 'bg-red-100 dark:bg-red-900/20 border-red-400'
                        : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600'
                    }`}>
                      <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">{step.step_number}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-gray-800 dark:text-gray-200">{step.action}</span>
                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                          <span>{new Date(step.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          {step.elapsed_ms > 0 && <span>{step.elapsed_ms < 1000 ? `${step.elapsed_ms}ms` : `${(step.elapsed_ms / 1000).toFixed(1)}s`}</span>}
                        </div>
                      </div>
                      {step.error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{step.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <Shield className="w-3.5 h-3.5" />
          <span>All provisioning is backend-managed. No cloud credentials are exposed to the UI.</span>
        </div>
      </div>
    </AdminGuard>
  );
}
