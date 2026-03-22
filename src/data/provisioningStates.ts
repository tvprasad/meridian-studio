// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import type { ProvisioningStatus } from '../api/runtimes';

export interface ProvisioningStatusMeta {
  label: string;
  color: string;
  bgColor: string;
  dotColor: string;
  order: number;
}

export const PROVISIONING_STATUS_META: Record<ProvisioningStatus, ProvisioningStatusMeta> = {
  QUEUED: {
    label: 'Queued', color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800', dotColor: 'bg-gray-400', order: 0,
  },
  PROVISIONING_CLUSTER: {
    label: 'Provisioning Cluster', color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20', dotColor: 'bg-blue-500', order: 1,
  },
  INSTALLING_CONTROLLERS: {
    label: 'Installing Controllers', color: 'text-violet-700 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20', dotColor: 'bg-violet-500', order: 2,
  },
  INSTALLING_RUNTIME: {
    label: 'Installing Runtime', color: 'text-indigo-700 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20', dotColor: 'bg-indigo-500', order: 3,
  },
  DEPLOYING_MERIDIAN: {
    label: 'Deploying Meridian', color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20', dotColor: 'bg-amber-500', order: 4,
  },
  READY: {
    label: 'Ready', color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', dotColor: 'bg-emerald-500', order: 5,
  },
  FAILED: {
    label: 'Failed', color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20', dotColor: 'bg-red-500', order: 5,
  },
  CANCELLED: {
    label: 'Cancelled', color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800', dotColor: 'bg-gray-400', order: 5,
  },
};

/** Happy-path phases for timeline. */
export const PROVISIONING_PHASES: ProvisioningStatus[] = [
  'QUEUED',
  'PROVISIONING_CLUSTER',
  'INSTALLING_CONTROLLERS',
  'INSTALLING_RUNTIME',
  'DEPLOYING_MERIDIAN',
  'READY',
];

export const CLOUD_LABELS: Record<string, string> = {
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'GCP',
};

export const REGION_LABELS: Record<string, string> = {
  'us-east-1': 'US East (Virginia)',
  'us-west-2': 'US West (Oregon)',
  'eu-west-1': 'EU West (Ireland)',
  eastus2: 'East US 2',
  westus2: 'West US 2',
};
