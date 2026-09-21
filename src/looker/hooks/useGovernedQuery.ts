import { useEffect, useRef } from 'react';
import { useLookerQuery, type UseLookerQueryResult } from './useLookerQuery';
import type { LookerQueryPayload, RegisteredQuery, GovernedAppProps } from '../../types/looker';

export interface NamedGovernedQuery {
  name: string;
  query: UseLookerQueryResult<any>;
}

/**
 * useGovernedQuerySync
 *
 * Automatically collects and synchronizes query states and telemetry
 * (latency, cache hit, execution status, compiled payload)
 * with the Semantic Inspector, eliminating massive dependency arrays
 * and boilerplate useEffect blocks.
 */
export function useGovernedQuerySync(
  queries: NamedGovernedQuery[],
  onRegisterQueries?: GovernedAppProps['onRegisterQueries']
): void {
  const onRegisterRef = useRef(onRegisterQueries);
  onRegisterRef.current = onRegisterQueries;

  // Track serialized telemetry snapshot to only trigger updates on actual state changes
  const telemetrySignature = queries
    .map(
      (q) =>
        `${q.name}:${q.query.loading}:${q.query.error ? 'err' : 'ok'}:${q.query.executionTimeMs}:${q.query.fromCache}`
    )
    .join('|');

  useEffect(() => {
    if (!onRegisterRef.current) return;

    const registered: RegisteredQuery[] = queries.map(({ name, query }) => ({
      name,
      payload: query.queryPayload,
      executionTimeMs: query.executionTimeMs,
      fromCache: query.fromCache,
      status: query.loading ? 'loading' : query.error ? 'error' : 'success',
    }));

    onRegisterRef.current(registered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telemetrySignature]);
}

/**
 * useGovernedQuery
 *
 * Single-query convenience hook combining useLookerQuery with automatic
 * Semantic Inspector registration.
 */
export function useGovernedQuery<T = Record<string, unknown>>(
  name: string,
  payload: LookerQueryPayload,
  onRegisterQueries?: GovernedAppProps['onRegisterQueries'],
  enabled: boolean = true
): UseLookerQueryResult<T> {
  const query = useLookerQuery<T>(payload, enabled);
  useGovernedQuerySync([{ name, query }], onRegisterQueries);
  return query;
}
