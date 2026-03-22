// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Server, Shield } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { AdminGuard } from '../components/admin/AdminGuard';
import { runtimesApi, type CreateRuntimeRequest } from '../api/runtimes';

const CLOUDS = [
  { value: 'aws', label: 'AWS' },
  { value: 'azure', label: 'Azure' },
  { value: 'gcp', label: 'GCP' },
] as const;

const REGIONS: Record<string, { value: string; label: string }[]> = {
  aws: [
    { value: 'us-east-1', label: 'US East (Virginia)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'EU West (Ireland)' },
  ],
  azure: [
    { value: 'eastus2', label: 'East US 2' },
    { value: 'westus2', label: 'West US 2' },
    { value: 'westeurope', label: 'West Europe' },
  ],
  gcp: [
    { value: 'us-central1', label: 'US Central' },
    { value: 'us-east1', label: 'US East' },
    { value: 'europe-west1', label: 'Europe West' },
  ],
};

export function ProvisionRuntime() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [cloud, setCloud] = useState<'aws' | 'azure' | 'gcp'>('aws');
  const [region, setRegion] = useState('us-east-1');
  const [clusterName, setClusterName] = useState('');
  const [nodeType, setNodeType] = useState('t3.medium');
  const [nodeCount, setNodeCount] = useState(3);

  const createMutation = useMutation({
    mutationFn: (body: CreateRuntimeRequest) => runtimesApi.create(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['runtimes'] });
      navigate(`/admin/runtimes/${encodeURIComponent(data.id)}`);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({
      name,
      cloud,
      region,
      config: {
        cluster_name: clusterName || `meridian-${name.toLowerCase().replace(/\s+/g, '-')}`,
        node_type: nodeType,
        node_count: nodeCount,
      },
    });
  }

  const isValid = name.trim().length > 0;

  return (
    <AdminGuard>
      <div className="max-w-2xl">
        <Link to="/admin/runtimes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Runtime Environments
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Provision Runtime</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Create a new governed runtime environment. Provisioning is executed by the backend — Studio does not call cloud APIs directly.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <Card>
            <div className="space-y-4">
              {/* Environment name */}
              <div>
                <label htmlFor="rt-name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Environment Name
                </label>
                <input
                  id="rt-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. staging-east, prod-us"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              {/* Cloud */}
              <div>
                <label htmlFor="rt-cloud" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Cloud Provider
                </label>
                <select
                  id="rt-cloud"
                  value={cloud}
                  onChange={(e) => { setCloud(e.target.value as 'aws' | 'azure' | 'gcp'); setRegion(REGIONS[e.target.value][0].value); }}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  {CLOUDS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Region */}
              <div>
                <label htmlFor="rt-region" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Region
                </label>
                <select
                  id="rt-region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  {(REGIONS[cloud] ?? []).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Cluster Configuration</h3>
            <div className="space-y-4">
              {/* Cluster name */}
              <div>
                <label htmlFor="rt-cluster" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Cluster Name
                </label>
                <input
                  id="rt-cluster"
                  type="text"
                  value={clusterName}
                  onChange={(e) => setClusterName(e.target.value)}
                  placeholder={`meridian-${name.toLowerCase().replace(/\s+/g, '-') || 'env'}`}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <p className="text-xs text-gray-400 mt-1">Leave blank to auto-generate from environment name.</p>
              </div>

              {/* Node type */}
              <div>
                <label htmlFor="rt-nodetype" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Node Type
                </label>
                <input
                  id="rt-nodetype"
                  type="text"
                  value={nodeType}
                  onChange={(e) => setNodeType(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              {/* Node count */}
              <div>
                <label htmlFor="rt-nodecount" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Node Count
                </label>
                <input
                  id="rt-nodecount"
                  type="number"
                  min={1}
                  max={20}
                  value={nodeCount}
                  onChange={(e) => setNodeCount(Number(e.target.value))}
                  className="mt-1 w-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={!isValid || createMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <Server className="w-4 h-4" />
              {createMutation.isPending ? 'Creating...' : 'Create Runtime'}
            </button>
            {createMutation.isError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {(createMutation.error as Error).message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <Shield className="w-3.5 h-3.5" />
            <span>Provisioning is backend-managed. No cloud credentials leave the server.</span>
          </div>
        </form>
      </div>
    </AdminGuard>
  );
}
