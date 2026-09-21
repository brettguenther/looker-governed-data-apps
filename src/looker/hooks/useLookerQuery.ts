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
  fromCache: boolean;
  queryPayload: LookerQueryPayload;
}

interface QueryCacheEntry {
  data: unknown[];
  executionTimeMs: number;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes SWR cache TTL
const MAX_CONCURRENT_QUERIES = 4;
const DEBOUNCE_MS = 150;

const QUERY_CACHE = new Map<string, QueryCacheEntry>();
const IN_FLIGHT_REQUESTS = new Map<string, Promise<{ data: unknown[]; elapsed: number }>>();

let activeQueryCount = 0;
const concurrencyQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeQueryCount < MAX_CONCURRENT_QUERIES) {
    activeQueryCount += 1;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    concurrencyQueue.push(() => {
      activeQueryCount += 1;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeQueryCount = Math.max(0, activeQueryCount - 1);
  const next = concurrencyQueue.shift();
  if (next) {
    next();
  }
}

/**
 * Generates a deterministic cache key for any Looker query payload
 */
export function getCanonicalQueryKey(payload: LookerQueryPayload): string {
  const sortedFilters: Record<string, string> = {};
  if (payload.filters) {
    Object.keys(payload.filters)
      .sort()
      .forEach((k) => {
        const val = payload.filters![k];
        if (val !== undefined && val !== '') {
          sortedFilters[k] = val;
        }
      });
  }

  return JSON.stringify({
    model: payload.model,
    view: payload.view,
    fields: payload.fields,
    pivots: payload.pivots || [],
    filters: sortedFilters,
    sorts: payload.sorts || [],
    limit: String(payload.limit || ''),
    column_limit: String(payload.column_limit || ''),
    total: Boolean(payload.total),
  });
}

/**
 * Clears the client-side Looker query cache (e.g. on manual refresh or logout)
 */
export function clearLookerQueryCache(): void {
  QUERY_CACHE.clear();
}

export function getLookerQueryCacheStats(): { size: number; inFlight: number } {
  return {
    size: QUERY_CACHE.size,
    inFlight: IN_FLIGHT_REQUESTS.size,
  };
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
  const [fromCache, setFromCache] = useState<boolean>(false);

  const canonicalKey = getCanonicalQueryKey(payload);
  const activeRequestRef = useRef<string | null>(null);
  const isFirstMountRef = useRef<boolean>(true);

  const executeQuery = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!isAuthenticated || !enabled) {
        setLoading(false);
        return;
      }

      // 1. Check In-Memory SWR Cache first
      if (!forceRefresh) {
        const cached = QUERY_CACHE.get(canonicalKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          setData(cached.data as T[]);
          setExecutionTimeMs(0);
          setFromCache(true);
          setError(null);
          setLoading(false);
          return;
        }
      }

      const currentRequestId = `${canonicalKey}_${Date.now()}`;
      activeRequestRef.current = currentRequestId;

      setLoading(true);
      setError(null);
      setFromCache(false);

      try {
        // 2. Deduplicate identical in-flight queries across components
        let requestPromise = IN_FLIGHT_REQUESTS.get(canonicalKey);

        if (!requestPromise || forceRefresh) {
          requestPromise = (async () => {
            await acquireSlot();
            const startTime = performance.now();
            try {
              const response = await sdk.run_inline_query({
                result_format: 'json',
                body: payload as unknown as IWriteQuery,
              });

              const elapsed = Math.round(performance.now() - startTime);

              if (response.ok) {
                let resultData = response.value;
                if (typeof resultData === 'string') {
                  try {
                    resultData = JSON.parse(resultData);
                  } catch {
                    // keep as is
                  }
                }
                const parsedArray = Array.isArray(resultData) ? resultData : [];
                QUERY_CACHE.set(canonicalKey, {
                  data: parsedArray,
                  executionTimeMs: elapsed,
                  timestamp: Date.now(),
                });
                return { data: parsedArray, elapsed };
              } else {
                const errorDetail = response.error
                  ? JSON.stringify(response.error)
                  : 'Query execution failed';
                throw new Error(errorDetail);
              }
            } finally {
              releaseSlot();
            }
          })();

          IN_FLIGHT_REQUESTS.set(canonicalKey, requestPromise);
          requestPromise.finally(() => {
            if (IN_FLIGHT_REQUESTS.get(canonicalKey) === requestPromise) {
              IN_FLIGHT_REQUESTS.delete(canonicalKey);
            }
          });
        }

        const { data: resultData, elapsed } = await requestPromise;

        // Ignore results if a newer query was triggered by this hook instance
        if (activeRequestRef.current !== currentRequestId) {
          return;
        }

        setData(resultData as T[]);
        setExecutionTimeMs(elapsed);
        setFromCache(false);
      } catch (err: unknown) {
        if (activeRequestRef.current === currentRequestId) {
          const queryError = err instanceof Error ? err : new Error(String(err));
          setError(queryError);
          setData([]);
        }
      } finally {
        if (activeRequestRef.current === currentRequestId) {
          setLoading(false);
        }
      }
    },
    [sdk, isAuthenticated, enabled, canonicalKey, payload]
  );

  useEffect(() => {
    if (!isAuthenticated || !enabled) return;

    // Immediate resolution if cached or on first mount
    const cached = QUERY_CACHE.get(canonicalKey);
    if (isFirstMountRef.current || (cached && Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      isFirstMountRef.current = false;
      executeQuery(false);
      return;
    }

    // Debounce rapid filter modifications so intermediate states are skipped
    const timer = setTimeout(() => {
      executeQuery(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [executeQuery, canonicalKey, isAuthenticated, enabled]);

  const refetch = useCallback(() => executeQuery(true), [executeQuery]);

  return {
    data,
    loading,
    error,
    refetch,
    executionTimeMs,
    fromCache,
    queryPayload: payload,
  };
}
