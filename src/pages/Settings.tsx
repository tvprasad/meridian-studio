import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { meridianApi } from '../api/meridian';
import { type SettingsResponse } from '../api/types';
import { CheckCircle, AlertCircle, BrainCircuit, Database, SlidersHorizontal, Languages, Eye, AudioLines, Loader2 } from 'lucide-react';

const settingsSchema = z.object({
  llm_provider: z.enum(['local', 'azure']),
  retrieval_provider: z.enum(['chroma', 'azure']),
  retrieval_threshold: z.number().min(0).max(1),
});

type SettingsForm = z.infer<typeof settingsSchema>;

function toFormValues(s: SettingsResponse | undefined): SettingsForm {
  return {
    llm_provider: (s?.llm_provider as SettingsForm['llm_provider']) ?? 'local',
    retrieval_provider: (s?.retrieval_provider as SettingsForm['retrieval_provider']) ?? 'chroma',
    retrieval_threshold: s?.retrieval_threshold ?? 0.6,
  };
}

export function Settings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: meridianApi.getSettings,
  });

  // Seed defaultValues from cache so form shows correct values immediately on remount
  const cachedSettings = queryClient.getQueryData<SettingsResponse>(['settings']);

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: toFormValues(cachedSettings),
  });

  // Keep in sync when a background refetch brings in fresh data.
  useEffect(() => {
    if (settings) {
      form.reset(toFormValues(settings));
    }
  }, [settings, form]);

  const mutation = useMutation({
    mutationFn: meridianApi.updateSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      void queryClient.invalidateQueries({ queryKey: ['health'] });
    },
  });

  const threshold = form.watch('retrieval_threshold');
  const isDirty = form.formState.isDirty;

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Choose your LLM and retrieval providers, adjust the confidence threshold, and review Cognitive AI service status.</p>
        </div>
        {isDirty && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-full ring-1 ring-amber-200 dark:ring-amber-800">
            Unsaved changes
          </span>
        )}
      </div>

      <form onSubmit={onSubmit}>
        <Card className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold dark:text-white">Provider Configuration</h2>
            {isLoading && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading...
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2 mb-5">Changes apply immediately but are reset on server restart. Set environment variables for persistent configuration.</p>

          <div className="space-y-6">
            <div>
              <label htmlFor="llm_provider" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
                <BrainCircuit className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                LLM Provider
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">The large language model that generates answers from retrieved context.</p>
              <select
                id="llm_provider"
                {...form.register('llm_provider')}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-white/15 shadow-sm focus:border-primary-500 focus:ring-primary-500 border p-2 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="local">Local (Ollama)</option>
                <option value="azure">Azure OpenAI</option>
              </select>
            </div>

            <div>
              <label htmlFor="retrieval_provider" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
                <Database className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                Retrieval Provider
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">The vector store used to find relevant document passages for each query.</p>
              <select
                id="retrieval_provider"
                {...form.register('retrieval_provider')}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-white/15 shadow-sm focus:border-primary-500 focus:ring-primary-500 border p-2 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="chroma">Local (Chroma)</option>
                <option value="azure">Azure AI Search</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="retrieval_threshold" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
                  <SlidersHorizontal className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  Retrieval Threshold
                </label>
                <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                  {(threshold * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Minimum similarity score for a passage to be included. Higher values mean stricter matching — the model may refuse to answer if no passages meet the threshold.</p>
              <input
                id="retrieval_threshold"
                type="range"
                min="0"
                max="1"
                step="0.05"
                {...form.register('retrieval_threshold', { valueAsNumber: true })}
                className="mt-2 block w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {mutation.isSuccess && (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Settings saved</span>
                </>
              )}
              {mutation.isError && (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-600 dark:text-red-400">{(mutation.error as Error).message}</span>
                </>
              )}
            </div>
            <div className="flex gap-3">
              {isDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { form.reset(); mutation.reset(); }}
                >
                  Discard
                </Button>
              )}
              <Button type="submit" loading={mutation.isPending} disabled={!isDirty}>
                Save changes
              </Button>
            </div>
          </div>
        </Card>
      </form>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold dark:text-white mb-4">Cognitive AI Services</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Standalone Azure AI capabilities available alongside the RAG engine.
          These services are configured via backend environment variables and do not affect query behavior.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <Languages className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            Language Service
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <Eye className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            Vision Service
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <AudioLines className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            Speech Service
          </li>
        </ul>
      </Card>
    </div>
  );
}
