// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { Card } from './Card';

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  subtitle?: string;
  description?: string;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  subtitle,
  description,
}: MetricCardProps) {
  return (
    <Card className="group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1 tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
          {description && <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1 leading-relaxed">{description}</p>}
        </div>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor} group-hover:scale-110 transition-transform duration-200`} />
        </div>
      </div>
    </Card>
  );
}
