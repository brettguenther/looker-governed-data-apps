import { useState, useEffect, useCallback, useRef } from 'react';
import { useLookerAuth } from '../auth/LookerAuthProvider';
import type { LookerQueryPayload } from '../../types/looker';
import type { IWriteQuery } from '@looker/sdk/lib/4.0/models';

export interface UseLookerQueryResult<T = Record<string, unknown>> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  executionTimeMs: number | null;
  queryPayload: LookerQueryPayload;
}

export function useLookerQuery<T = Record<string, unknown>>(
  payload: LookerQueryPayload,
  enabled: boolean = true
): UseLookerQueryResult<T> {
  const { sdk, isAuthenticated } = useLookerAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);

  const payloadString = JSON.stringify(payload);
  const activeRequestRef = useRef<string | null>(null);

  const executeQuery = useCallback(async () => {
    if (!isAuthenticated || !enabled) {
      setLoading(false);
      return;
    }

    const currentKey = `${payloadString}_${Date.now()}`;
    activeRequestRef.current = currentKey;

    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      // Execute query directly against Looker CORS API
      const response = await sdk.run_inline_query({
        result_format: 'json',
        body: payload as unknown as IWriteQuery,
      });

      // Ignore results from older stale queries if another was launched
      if (activeRequestRef.current !== currentKey) {
        return;
      }

      const elapsed = Math.round(performance.now() - startTime);
      setExecutionTimeMs(elapsed);

      if (response.ok) {
        let resultData = response.value;
        if (typeof resultData === 'string') {
          try {
            resultData = JSON.parse(resultData);
          } catch {
            // keep as is
          }
        }
        setData(Array.isArray(resultData) ? (resultData as T[]) : []);
      } else {
        const errorDetail = response.error ? JSON.stringify(response.error) : 'Query execution failed';
        throw new Error(errorDetail);
      }
    } catch (err: unknown) {
      if (activeRequestRef.current === currentKey) {
        const queryError = err instanceof Error ? err : new Error(String(err));
        setError(queryError);
        setData([]);
      }
    } finally {
      if (activeRequestRef.current === currentKey) {
        setLoading(false);
      }
    }
  }, [sdk, isAuthenticated, enabled, payloadString, payload]);

  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  return {
    data,
    loading,
    error,
    refetch: executeQuery,
    executionTimeMs,
    queryPayload: payload,
  };
}
