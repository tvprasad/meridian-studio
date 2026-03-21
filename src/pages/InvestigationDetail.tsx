// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ExternalLink, Copy, Check, Shield, Clock,
  FileSearch, BarChart3, ChevronDown, ChevronRight,
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['trace']));

  const { data: inv, isLoading, error } = useQuery({
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

  if (error || !inv) {
    return (
      <Card className="border-l-4 border-l-red-400">
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load investigation {traceId}.
        </p>
        <Link to="/investigations" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mt-2">
          <ArrowLeft className="w-4 h-4" /> Back to list
        </Link>
      </Card>
    );
  }

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
          {inv.title && (
            <p className="text-gray-600 dark:text-gray-300 mt-1">{inv.title}</p>
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
      {inv.status === 'AWAITING_APPROVAL' && inv.execution_plan && (
        <ApprovalPanel
          executionPlan={inv.execution_plan}
          policyRationale={inv.policy_rationale}
          traceId={inv.trace_id}
          onApprove={(ref, planId) => approveMutation.mutate({ approvalRef: ref, planId })}
          onReject={(reason) => rejectMutation.mutate(reason)}
          isSubmitting={approveMutation.isPending || rejectMutation.isPending}
        />
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column (3/5) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Description */}
          {inv.description && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Description</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{inv.description}</p>
            </Card>
          )}

          {/* Analysis */}
          {inv.root_cause_hypothesis && (
            <CollapsibleSection
              title="Analysis"
              icon={<BarChart3 className="w-4 h-4 text-violet-500" />}
              expanded={expandedSections.has('analysis')}
              onToggle={() => toggleSection('analysis')}
            >
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  {inv.confidence != null && <ConfidencePill score={inv.confidence} />}
                  {inv.severity && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      inv.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                      inv.severity === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                      inv.severity === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {inv.severity} severity
                    </span>
                  )}
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Root Cause Hypothesis</dt>
                  <dd className="mt-0.5 text-gray-700 dark:text-gray-300">{inv.root_cause_hypothesis}</dd>
                </div>
                {inv.confidence_rationale && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Confidence Rationale</dt>
                    <dd className="mt-0.5 text-gray-700 dark:text-gray-300">{inv.confidence_rationale}</dd>
                  </div>
                )}
                {inv.gaps.length > 0 && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Gaps</dt>
                    <dd className="mt-1 text-gray-600 dark:text-gray-400">
                      <ul className="list-disc list-inside">{inv.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
                    </dd>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Evidence */}
          {inv.findings.length > 0 && (
            <CollapsibleSection
              title={`Evidence (${inv.findings.length} findings)`}
              icon={<FileSearch className="w-4 h-4 text-blue-500" />}
              expanded={expandedSections.has('evidence')}
              onToggle={() => toggleSection('evidence')}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{inv.data_sources_queried.length} sources queried</span>
                  {inv.data_sources_failed.length > 0 && (
                    <span className="text-red-500">{inv.data_sources_failed.length} sources failed</span>
                  )}
                </div>
                {inv.findings.map((finding) => (
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
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
        </div>

        {/* Right column (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Execution Plan (when not awaiting approval — approval panel handles that case) */}
          {inv.execution_plan && inv.status !== 'AWAITING_APPROVAL' && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Execution Plan</h3>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Plan ID</dt>
                  <dd className="font-mono text-gray-600 dark:text-gray-300">{inv.execution_plan.plan_id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Action</dt>
                  <dd className="text-gray-600 dark:text-gray-300">{inv.execution_plan.action_summary}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Blast Radius</dt>
                  <dd className="font-medium text-gray-600 dark:text-gray-300">{inv.execution_plan.blast_radius}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Reversible</dt>
                  <dd className="text-gray-600 dark:text-gray-300">{inv.execution_plan.reversible ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </Card>
          )}

          {/* Execution Result */}
          {inv.execution_status && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Execution Result</h3>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className={`font-medium ${inv.execution_status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {inv.execution_status}
                  </dd>
                </div>
                {inv.execution_verification && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Verification</dt>
                    <dd className="text-gray-600 dark:text-gray-300">{inv.execution_verification}</dd>
                  </div>
                )}
                {inv.rollback_script && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Rollback</dt>
                    <dd className="font-mono text-gray-600 dark:text-gray-300 mt-0.5 break-all">{inv.rollback_script}</dd>
                  </div>
                )}
              </dl>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Metadata</h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Steps</dt>
                <dd className="font-mono text-gray-600 dark:text-gray-300">{inv.step_count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Terminal</dt>
                <dd className="font-mono text-gray-600 dark:text-gray-300">{inv.is_terminal ? 'Yes' : 'No'}</dd>
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
        title={`Audit Trace (${inv.step_count} steps)`}
        icon={<Shield className="w-4 h-4 text-gray-500" />}
        expanded={expandedSections.has('trace')}
        onToggle={() => toggleSection('trace')}
        className="bg-white dark:bg-white/[0.02] rounded-xl border border-gray-200 dark:border-white/10 p-6"
      >
        <AuditTrace steps={inv.steps} />
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
