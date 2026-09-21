import { useState, useEffect } from 'react';
import { useLookerAuth } from '../auth/LookerAuthProvider';
import type { IWriteQuery } from '@looker/sdk/lib/4.0/models';

const SUGGESTIONS_CACHE = new Map<string, string[]>();
const IN_FLIGHT_SUGGESTIONS = new Map<string, Promise<string[]>>();

export function useFieldSuggestions(model: string, view: string, fieldName: string) {
  const { sdk, isAuthenticated } = useLookerAuth();
  const fullField = fieldName.includes('.') ? fieldName : `${view}.${fieldName}`;
  const cacheKey = `${model}::${view}::${fullField}`;

  const [suggestions, setSuggestions] = useState<string[]>(() => {
    return SUGGESTIONS_CACHE.get(cacheKey) || [];
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated || !model || !view || !fieldName) return;

    const cached = SUGGESTIONS_CACHE.get(cacheKey);
    if (cached) {
      setSuggestions(cached);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        let promise = IN_FLIGHT_SUGGESTIONS.get(cacheKey);
        if (!promise) {
          promise = (async () => {
            const queryBody: IWriteQuery = {
              model,
              view,
              fields: [fullField],
              sorts: [`${fullField} asc`],
              limit: '100',
            };

            const response = await sdk.run_inline_query({
              result_format: 'json',
              body: queryBody,
            });

            if (response.ok) {
              let rawData: unknown = response.value;
              if (typeof rawData === 'string') {
                try {
                  rawData = JSON.parse(rawData);
                } catch {
                  rawData = [];
                }
              }
              if (Array.isArray(rawData)) {
                const values = rawData
                  .map((row: Record<string, unknown>) => row[fullField])
                  .filter((v): v is string | number => v !== null && v !== undefined && v !== '')
                  .map((v) => String(v));
                const unique = Array.from(new Set(values));
                SUGGESTIONS_CACHE.set(cacheKey, unique);
                return unique;
              }
            }
            return [];
          })();

          IN_FLIGHT_SUGGESTIONS.set(cacheKey, promise);
          promise.finally(() => {
            if (IN_FLIGHT_SUGGESTIONS.get(cacheKey) === promise) {
              IN_FLIGHT_SUGGESTIONS.delete(cacheKey);
            }
          });
        }

        const values = await promise;
        if (isMounted) {
          setSuggestions(values);
        }
      } catch (err) {
        console.warn(`Could not fetch suggestions for ${fieldName}:`, err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSuggestions();

    return () => {
      isMounted = false;
    };
  }, [sdk, isAuthenticated, model, view, fieldName, fullField, cacheKey]);

  return { suggestions, loading };
}
