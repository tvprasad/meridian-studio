// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ExternalLink, Copy, Check, Shield, Clock,
  Target, FileSearch, BarChart3, BookOpen, Zap, ChevronDown, ChevronRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { InvestigationBadge } from '../components/ops/InvestigationBadge';
import { WorkflowTimeline } from '../components/ops/WorkflowTimeline';
import { ApprovalPanel } from '../components/ops/ApprovalPanel';
import { AuditTrace } from '../components/ops/AuditTrace';
import { ConfidencePill } from '../components/ui/ConfidencePill';
import { investigationApi } from '../api/investigation';

export function InvestigationDetail() {
  const { traceId } = useParams<{ traceId: string }>();
  const queryClient = useQueryClient();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'trace']));

  const { data: investigation, isLoading, error } = useQuery({
    queryKey: ['investigation', traceId],
    queryFn: () => investigationApi.get(traceId!),
    enabled: !!traceId,
    refetchInterval: 10_000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ approvalRef, planId }: { approvalRef: string; planId: string }) =>
      investigationApi.approve(traceId!, approvalRef, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigation', traceId] });
      queryClient.invalidateQueries({ queryKey: ['investigations'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => investigationApi.reject(traceId!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigation', traceId] });
      queryClient.invalidateQueries({ queryKey: ['investigations'] });
    },
  });

  function toggleSection(key: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  if (error || !investigation) {
    return (
      <Card className="border-l-4 border-l-red-400">
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load investigation {traceId}. The backend may not have GET /ops/investigations/:trace_id implemented yet.
        </p>
        <Link to="/investigations" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mt-2">
          <ArrowLeft className="w-4 h-4" /> Back to list
        </Link>
      </Card>
    );
  }

  const inv = investigation;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/investigations" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Investigations
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <a href={inv.jira_url} target="_blank" rel="noopener noreferrer" className="text-2xl font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 inline-flex items-center gap-1">
              {inv.jira_key}
              <ExternalLink className="w-4 h-4" />
            </a>
            <InvestigationBadge status={inv.status} />
          </div>
          {inv.ticket_summary && (
            <p className="text-gray-600 dark:text-gray-300 mt-1">{inv.ticket_summary}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Created {new Date(inv.created_at).toLocaleString()}
            </span>
            {inv.investigation_type && (
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                {inv.investigation_type}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(inv.trace_id, 'trace')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {copiedField === 'trace' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            {inv.trace_id.slice(0, 28)}...
          </button>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Shield className="w-3 h-3" />
            All actions audited
          </div>
        </div>
      </div>

      {/* Workflow timeline */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Workflow Progress</h2>
        <WorkflowTimeline currentStatus={inv.status} />
      </Card>

      {/* Approval panel — shown when AWAITING_APPROVAL */}
      {inv.status === 'AWAITING_APPROVAL' && inv.policy_decision && (
        <ApprovalPanel
          policyDecision={inv.policy_decision}
          traceId={inv.trace_id}
          onApprove={(ref, planId) => approveMutation.mutate({ approvalRef: ref, planId })}
          onReject={(reason) => rejectMutation.mutate(reason)}
          isSubmitting={approveMutation.isPending || rejectMutation.isPending}
        />
      )}

      {/* Two-column layout: Summary/Evidence | Plan/Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column (3/5) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Investigation Plan */}
          {inv.investigation_plan && (
            <CollapsibleSection
              title="Investigation Plan"
              icon={<Target className="w-4 h-4 text-sky-500" />}
              expanded={expandedSections.has('plan')}
              onToggle={() => toggleSection('plan')}
            >
              <div className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Scope</dt>
                  <dd className="mt-0.5 text-gray-700 dark:text-gray-300">{inv.investigation_plan.scope}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Priority</dt>
                  <dd className="mt-0.5">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      inv.investigation_plan.priority === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                      inv.investigation_plan.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {inv.investigation_plan.priority}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Data Sources</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {inv.investigation_plan.data_sources.map((ds) => (
                      <span key={ds} className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs">{ds}</span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Questions</dt>
                  <dd className="mt-1">
                    <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-1">
                      {inv.investigation_plan.questions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ol>
                  </dd>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Evidence */}
          {inv.evidence && (
            <CollapsibleSection
              title={`Evidence (${inv.evidence.findings.length} findings)`}
              icon={<FileSearch className="w-4 h-4 text-blue-500" />}
              expanded={expandedSections.has('evidence')}
              onToggle={() => toggleSection('evidence')}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{inv.evidence.total_queries} queries</span>
                  <span>{inv.evidence.data_sources_queried.length} sources queried</span>
                  {inv.evidence.data_sources_failed.length > 0 && (
                    <span className="text-red-500">{inv.evidence.data_sources_failed.length} sources failed</span>
                  )}
                  <span>{(inv.evidence.collection_time_ms / 1000).toFixed(1)}s</span>
                </div>
                {inv.evidence.findings.map((finding) => (
                  <div key={finding.id} className="p-3 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">{finding.id}</span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        finding.relevance === 'high' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                        finding.relevance === 'medium' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {finding.relevance}
                      </span>
                      <span className="text-xs text-gray-400">{finding.source}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{finding.summary}</p>
                    <span className="text-xs text-gray-400 mt-1 block">via {finding.tool_used}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Analysis */}
          {inv.analysis && (
            <CollapsibleSection
              title="Analysis"
              icon={<BarChart3 className="w-4 h-4 text-violet-500" />}
              expanded={expandedSections.has('analysis')}
              onToggle={() => toggleSection('analysis')}
            >
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <ConfidencePill score={inv.analysis.confidence} />
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    inv.analysis.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                    inv.analysis.severity === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                    inv.analysis.severity === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {inv.analysis.severity} severity
                  </span>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Summary</dt>
                  <dd className="mt-0.5 text-gray-700 dark:text-gray-300">{inv.analysis.summary}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Root Cause Hypothesis</dt>
                  <dd className="mt-0.5 text-gray-700 dark:text-gray-300">{inv.analysis.root_cause_hypothesis}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Affected Systems</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {inv.analysis.affected_systems.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 text-xs">{s}</span>
                    ))}
                  </dd>
                </div>
                {inv.analysis.gaps.length > 0 && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Gaps</dt>
                    <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <ul className="list-disc list-inside">{inv.analysis.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
                    </dd>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}
        </div>

        {/* Right column (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Policy Decision */}
          {inv.policy_decision && (
            <CollapsibleSection
              title="Policy Decision"
              icon={<BookOpen className="w-4 h-4 text-amber-500" />}
              expanded={expandedSections.has('policy')}
              onToggle={() => toggleSection('policy')}
            >
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    inv.policy_decision.action_recommended
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {inv.policy_decision.action_recommended ? 'Action Recommended' : 'No Action'}
                  </span>
                  <span className="text-xs text-gray-400">Risk: {(inv.policy_decision.risk_score * 100).toFixed(0)}%</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{inv.policy_decision.rationale}</p>
                {inv.policy_decision.requires_approval_from.length > 0 && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Requires Approval From</dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {inv.policy_decision.requires_approval_from.map((r) => (
                        <span key={r} className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs">{r}</span>
                      ))}
                    </dd>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Execution Result */}
          {inv.execution_result && (
            <CollapsibleSection
              title="Execution Result"
              icon={<Zap className="w-4 h-4 text-emerald-500" />}
              expanded={expandedSections.has('execution')}
              onToggle={() => toggleSection('execution')}
            >
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    inv.execution_result.status === 'success'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {inv.execution_result.status}
                  </span>
                  <span className="text-xs text-gray-400">{(inv.execution_result.elapsed_ms / 1000).toFixed(1)}s</span>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Verification</dt>
                  <dd className="mt-0.5 text-gray-700 dark:text-gray-300">{inv.execution_result.verification}</dd>
                  <dd className="mt-0.5">
                    <span className={`text-xs font-medium ${inv.execution_result.verification_passed ? 'text-emerald-600' : 'text-red-600'}`}>
                      {inv.execution_result.verification_passed ? 'Passed' : 'Failed'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Tool</dt>
                  <dd className="mt-0.5 font-mono text-xs text-gray-600 dark:text-gray-400">{inv.execution_result.tool_used}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Output Hash</dt>
                  <dd className="mt-0.5 font-mono text-xs text-gray-400">{inv.execution_result.tool_output_hash.slice(0, 16)}...</dd>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Metadata */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Metadata</h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Version</dt>
                <dd className="font-mono text-gray-600 dark:text-gray-300">{inv.version}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Retries</dt>
                <dd className="font-mono text-gray-600 dark:text-gray-300">{inv.retry_count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Steps Logged</dt>
                <dd className="font-mono text-gray-600 dark:text-gray-300">{inv.step_log.length}</dd>
              </div>
              {inv.approval_ref && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Approval Ref</dt>
                  <dd className="font-mono text-gray-600 dark:text-gray-300">{inv.approval_ref.slice(0, 20)}...</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>

      {/* Audit Trace — full width */}
      <CollapsibleSection
        title={`Audit Trace (${inv.step_log.length} steps)`}
        icon={<Shield className="w-4 h-4 text-gray-500" />}
        expanded={expandedSections.has('trace')}
        onToggle={() => toggleSection('trace')}
        className="bg-white dark:bg-white/[0.02] rounded-xl border border-gray-200 dark:border-white/10 p-6"
      >
        <AuditTrace steps={inv.step_log} />
      </CollapsibleSection>
    </div>
  );
}

// ── Collapsible section helper ──────────────────────────────────────

function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? ''}>
      <Card className={className ? 'border-none shadow-none p-0' : ''}>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </button>
        {expanded && <div className="mt-4">{children}</div>}
      </Card>
    </div>
  );
}
