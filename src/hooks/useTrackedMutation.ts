import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { useDiagnostics } from './useDiagnosticsHook';

interface TrackingMeta {
  service: string;
  operation: string;
}

/**
 * Wraps useMutation to automatically record calls to the Diagnostics panel.
 * Expects the response to have optional `elapsed_ms` and `request_id` fields.
 */
export function useTrackedMutation<TData = unknown, TError = Error, TVariables = void, TOnMutateResult = unknown>(
  meta: TrackingMeta,
  options: UseMutationOptions<TData, TError, TVariables, TOnMutateResult>,
) {
  const { recordCall } = useDiagnostics();
  const start = { current: 0 };

  return useMutation<TData, TError, TVariables, TOnMutateResult>({
    ...options,
    onMutate: (variables, context) => {
      start.current = performance.now();
      return options.onMutate?.(variables, context) as TOnMutateResult | Promise<TOnMutateResult>;
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      const elapsed = Math.round(performance.now() - start.current);
      const resp = data as Record<string, unknown> | null;
      recordCall({
        service: meta.service,
        operation: meta.operation,
        status: 'ok',
        latencyMs: (resp?.elapsed_ms as number) ?? elapsed,
        requestId: resp?.request_id as string | undefined,
      });
      return options.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      const elapsed = Math.round(performance.now() - start.current);
      recordCall({
        service: meta.service,
        operation: meta.operation,
        status: 'error',
        latencyMs: elapsed,
      });
      return options.onError?.(error, variables, onMutateResult, context);
    },
  });
}
