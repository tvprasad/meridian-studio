// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useState } from 'react';
import { ShieldCheck, ShieldX, Lock, RotateCcw } from 'lucide-react';
import type { ExecutionPlanSummary } from '../../api/investigation';
import { Card } from '../ui/Card';

interface ApprovalPanelProps {
  executionPlan: ExecutionPlanSummary;
  policyRationale: string | null;
  traceId: string;
  onApprove: (approvalRef: string, planId: string) => void;
  onReject: (reason: string) => void;
  isSubmitting?: boolean;
}

export function ApprovalPanel({ executionPlan, policyRationale, traceId, onApprove, onReject, isSubmitting }: ApprovalPanelProps) {
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject'>('idle');
  const [rejectReason, setRejectReason] = useState('');

  const plan = executionPlan;

  const blastColors: Record<string, string> = {
    low: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
    medium: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    high: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
    critical: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  };

  return (
    <Card className="border-l-4 border-l-amber-400">
      {/* Warning banner */}
      <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Execution requires explicit approval</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">This action cannot proceed without approval. All execution is bounded and audited.</p>
        </div>
      </div>

      {/* Plan summary */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Execution Plan</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{plan.action_summary}</p>
        </div>

        {policyRationale && (
          <p className="text-sm text-gray-600 dark:text-gray-300 italic">{policyRationale}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Plan ID</dt>
            <dd className="font-mono text-xs mt-0.5 text-gray-700 dark:text-gray-300">{plan.plan_id}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Blast Radius</dt>
            <dd className="mt-0.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${blastColors[plan.blast_radius] ?? ''}`}>
                {plan.blast_radius.toUpperCase()}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Steps</dt>
            <dd className="font-medium mt-0.5 text-gray-700 dark:text-gray-300">{plan.total_steps}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Reversible</dt>
            <dd className="mt-0.5">
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${plan.reversible ? 'text-emerald-600' : 'text-red-600'}`}>
                <RotateCcw className="w-3 h-3" />
                {plan.reversible ? 'Yes' : 'No'}
              </span>
            </dd>
          </div>
        </div>

        {/* Action buttons */}
        {mode === 'idle' && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-white/10">
            <button
              onClick={() => setMode('approve')}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => setMode('reject')}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <ShieldX className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}

        {/* Approve confirmation */}
        {mode === 'approve' && (
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 space-y-3">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Confirm approval for plan {plan.plan_id}?
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              This will allow the Execution Agent to proceed with {plan.total_steps} bounded step{plan.total_steps > 1 ? 's' : ''}.
              All execution goes through Tool Gateway with full audit logging.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onApprove(`studio-${traceId}-${Date.now()}`, plan.plan_id)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Approving...' : 'Confirm Approval'}
              </button>
              <button
                onClick={() => setMode('idle')}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reject with reason */}
        {mode === 'reject' && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-3">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Reject execution plan?
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (required)"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => onReject(rejectReason)}
                disabled={isSubmitting || !rejectReason.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => { setMode('idle'); setRejectReason(''); }}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
