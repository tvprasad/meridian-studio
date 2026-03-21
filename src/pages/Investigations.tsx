// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, Shield, Activity, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { InvestigationBadge } from '../components/ops/InvestigationBadge';
import { investigationApi } from '../api/investigation';
import { STATUS_GROUPS } from '../data/investigationStates';

type FilterGroup = 'all' | 'active' | 'awaiting' | 'terminal';

export function Investigations() {
  const [filterGroup, setFilterGroup] = useState<FilterGroup>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: investigations, isLoading, error } = useQuery({
    queryKey: ['investigations'],
    queryFn: () => investigationApi.list(),
  });

  const { data: pendingIds } = useQuery({
    queryKey: ['investigations', 'pending-ids'],
    queryFn: investigationApi.pendingTraceIds,
    refetchInterval: 30_000,
  });

  const allInvestigations = investigations ?? [];

  // Client-side search + filter
  const filtered = allInvestigations.filter((inv) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!inv.jira_key.toLowerCase().includes(q) && !inv.trace_id.toLowerCase().includes(q)) return false;
    }
    if (filterGroup === 'active') return STATUS_GROUPS.active.includes(inv.status);
    if (filterGroup === 'awaiting') return STATUS_GROUPS.awaiting.includes(inv.status);
    if (filterGroup === 'terminal') return STATUS_GROUPS.terminal.includes(inv.status);
    return true;
  });

  const totalActive = allInvestigations.filter((i) => STATUS_GROUPS.active.includes(i.status)).length;
  const totalAwaiting = pendingIds?.length ?? 0;
  const totalCompleted = allInvestigations.filter((i) => i.status === 'COMPLETED').length;
  const totalRejected = allInvestigations.filter((i) => i.status === 'REJECTED' || i.status === 'EXPIRED' || i.status === 'FAILED').length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Investigations</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">
        Governed Ops Copilot workflows — Jira-triggered investigations with approval-gated execution and full audit trace.
      </p>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <button onClick={() => setFilterGroup('active')} className="text-left">
          <Card className={`border-l-4 border-l-blue-400 ${filterGroup === 'active' ? 'ring-2 ring-blue-400' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalActive}</p>
              </div>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
          </Card>
        </button>
        <button onClick={() => setFilterGroup('awaiting')} className="text-left">
          <Card className={`border-l-4 border-l-amber-400 ${filterGroup === 'awaiting' ? 'ring-2 ring-amber-400' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Awaiting Approval</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{totalAwaiting}</p>
              </div>
              <Shield className="w-5 h-5 text-amber-500" />
            </div>
          </Card>
        </button>
        <button onClick={() => { setFilterGroup('all'); }} className="text-left">
          <Card className={`border-l-4 border-l-emerald-400 ${filterGroup === 'all' ? 'ring-2 ring-emerald-400' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalCompleted}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
          </Card>
        </button>
        <button onClick={() => setFilterGroup('terminal')} className="text-left">
          <Card className={`border-l-4 border-l-red-400 ${filterGroup === 'terminal' ? 'ring-2 ring-red-400' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Rejected / Expired</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalRejected}</p>
              </div>
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
          </Card>
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-4 mt-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Jira key or trace ID..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <div className="flex items-center gap-1 text-sm">
          {(['all', 'active', 'awaiting', 'terminal'] as FilterGroup[]).map((group) => (
            <button
              key={group}
              onClick={() => setFilterGroup(group)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterGroup === group
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {group === 'all' ? 'All' : group === 'active' ? 'Active' : group === 'awaiting' ? 'Pending' : 'Closed'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/10 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <Card className="mt-6 border-l-4 border-l-red-400">
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load investigations. Check that the backend is running and the Ops Copilot endpoints are available.</p>
        </Card>
      )}

      {!isLoading && !error && filtered && (
        <div className="mt-6 bg-white dark:bg-white/[0.02] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jira Key</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Steps</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Updated</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trace ID</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 dark:text-gray-500">
                    {searchQuery ? 'No investigations match your search.' : 'No investigations found.'}
                  </td>
                </tr>
              )}
              {filtered.map((inv) => (
                <tr
                  key={inv.trace_id}
                  className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 px-4">
                    <InvestigationBadge status={inv.status} />
                  </td>
                  <td className="py-3 px-4">
                    <a
                      href={inv.jira_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {inv.jira_key}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{inv.investigation_type || '—'}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{inv.step_count}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs">
                    {new Date(inv.updated_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs text-gray-400 dark:text-gray-500">{inv.trace_id.slice(0, 24)}...</span>
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      to={`/investigations/${encodeURIComponent(inv.trace_id)}`}
                      className="inline-flex items-center text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Result count */}
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-white/10">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filtered.length} investigation{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Governance footer */}
      <div className="mt-6 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <Shield className="w-3.5 h-3.5" />
        <span>All investigations are governed by the Ops Copilot workflow. No execution occurs without explicit approval.</span>
      </div>
    </div>
  );
}
