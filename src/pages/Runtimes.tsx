// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, ChevronRight, Server, Shield } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { ProvisioningBadge } from '../components/admin/ProvisioningBadge';
import { AdminGuard } from '../components/admin/AdminGuard';
import { runtimesApi, PROVISIONING_TERMINAL } from '../api/runtimes';
import { CLOUD_LABELS } from '../data/provisioningStates';

export function Runtimes() {
  const { data: runtimes, isLoading, error } = useQuery({
    queryKey: ['runtimes'],
    queryFn: runtimesApi.list,
    refetchInterval: 10_000,
  });

  const allRuntimes = runtimes ?? [];
  const activeCount = allRuntimes.filter((r) => !PROVISIONING_TERMINAL.has(r.status)).length;
  const readyCount = allRuntimes.filter((r) => r.status === 'READY').length;

  return (
    <AdminGuard>
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Runtime Environments</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Governed runtime provisioning — platform-admin managed infrastructure.
            </p>
          </div>
          <Link
            to="/admin/provision"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Provision Runtime
          </Link>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Card className="border-l-4 border-l-blue-400">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{allRuntimes.length}</p>
          </Card>
          <Card className="border-l-4 border-l-amber-400">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Provisioning</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{activeCount}</p>
          </Card>
          <Card className="border-l-4 border-l-emerald-400">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Ready</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{readyCount}</p>
          </Card>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-white dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/10 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="mt-6 border-l-4 border-l-red-400">
            <p className="text-sm text-red-600 dark:text-red-400">Failed to load runtimes. Check that the backend admin endpoints are available.</p>
          </Card>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <div className="mt-6 bg-white dark:bg-white/[0.02] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cloud</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Region</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phase</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {allRuntimes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 dark:text-gray-500">
                      <Server className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No runtime environments provisioned yet.
                    </td>
                  </tr>
                )}
                {allRuntimes.map((rt) => (
                  <tr key={rt.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4"><ProvisioningBadge status={rt.status} /></td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{rt.name}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{CLOUD_LABELS[rt.cloud] ?? rt.cloud}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{rt.region}</td>
                    <td className="py-3 px-4 text-xs font-mono text-gray-500 dark:text-gray-400">{rt.current_step || '—'}</td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(rt.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <Link to={`/admin/runtimes/${encodeURIComponent(rt.id)}`} className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <Shield className="w-3.5 h-3.5" />
          <span>Runtime provisioning is platform-admin only. Studio never calls AWS directly — all infrastructure work is backend-managed.</span>
        </div>
      </div>
    </AdminGuard>
  );
}
