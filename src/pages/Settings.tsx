import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { meridianApi } from '../api/meridian';
import { type HealthResponse } from '../api/types';
import { CheckCircle, AlertCircle } from 'lucide-react';

const settingsSchema = z.object({
  llm_provider: z.enum(['local', 'azure']),
  retrieval_provider: z.enum(['chroma', 'azure']),
  retrieval_threshold: z.number().min(0).max(1),
});

type SettingsForm = z.infer<typeof settingsSchema>;

function toFormValues(h: HealthResponse | undefined): SettingsForm {
  return {
    llm_provider: (h?.llm_provider as SettingsForm['llm_provider']) ?? 'local',
    retrieval_provider: (h?.retrieval_provider as SettingsForm['retrieval_provider']) ?? 'chroma',
    retrieval_threshold: h?.retrieval_threshold ?? 0.6,
  };
}

export function Settings() {
  const queryClient = useQueryClient();

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: meridianApi.health,
  });

  // Seed defaultValues from cache so form shows correct values immediately on remount,
  // without waiting for the useEffect to fire after the first render.
  const cachedHealth = queryClient.getQueryData<HealthResponse>(['health']);

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: toFormValues(cachedHealth),
  });

  // Keep in sync when a background refetch brings in fresh data.
  useEffect(() => {
    if (health) {
      form.reset(toFormValues(health));
    }
  }, [health, form]);

  const mutation = useMutation({
    mutationFn: meridianApi.updateSettings,
    onSuccess: () => {
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
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Platform configuration</p>
        </div>
        {isDirty && (
          <span className="text-xs text-amber-600 font-medium px-2.5 py-1 bg-amber-50 rounded-full ring-1 ring-amber-200">
            Unsaved changes
          </span>
        )}
      </div>

      <form onSubmit={onSubmit}>
        <Card className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Provider Configuration</h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="llm_provider" className="block text-sm font-medium text-gray-700">
                LLM Provider
              </label>
              <select
                id="llm_provider"
                {...form.register('llm_provider')}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border p-2"
              >
                <option value="local">Local (Ollama)</option>
                <option value="azure">Azure OpenAI</option>
              </select>
            </div>

            <div>
              <label htmlFor="retrieval_provider" className="block text-sm font-medium text-gray-700">
                Retrieval Provider
              </label>
              <select
                id="retrieval_provider"
                {...form.register('retrieval_provider')}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border p-2"
              >
                <option value="chroma">Local (Chroma)</option>
                <option value="azure">Azure AI Search</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="retrieval_threshold" className="block text-sm font-medium text-gray-700">
                  Retrieval Threshold
                </label>
                <span className="text-sm font-semibold tabular-nums text-gray-900">
                  {(threshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                id="retrieval_threshold"
                type="range"
                min="0"
                max="1"
                step="0.05"
                {...form.register('retrieval_threshold', { valueAsNumber: true })}
                className="mt-2 block w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {mutation.isSuccess && (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600">Settings saved</span>
                </>
              )}
              {mutation.isError && (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-600">{(mutation.error as Error).message}</span>
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
        <h2 className="text-lg font-semibold mb-4">Azure AI Services</h2>
        <p className="text-sm text-gray-600">
          Configure Azure endpoints in the backend .env file.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Language Service
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Vision Service
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
            Speech Service (Coming Soon)
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
            Document Intelligence (Coming Soon)
          </li>
        </ul>
      </Card>
    </div>
  );
}
