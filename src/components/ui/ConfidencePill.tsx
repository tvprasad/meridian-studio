// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

interface ConfidencePillProps {
  score: number;
  rawScore?: number | null;
  threshold?: number;
}

export function ConfidencePill({ score, rawScore, threshold }: ConfidencePillProps) {
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
