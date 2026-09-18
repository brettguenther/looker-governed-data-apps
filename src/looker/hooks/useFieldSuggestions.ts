import { useState, useEffect } from 'react';
import { useLookerAuth } from '../auth/LookerAuthProvider';
import type { IWriteQuery } from '@looker/sdk/lib/4.0/models';

export function useFieldSuggestions(model: string, view: string, fieldName: string) {
  const { sdk, isAuthenticated } = useLookerAuth();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated || !model || !view || !fieldName) return;

    let isMounted = true;
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const fullField = fieldName.includes('.') ? fieldName : `${view}.${fieldName}`;
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

        if (isMounted && response.ok) {
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
            setSuggestions(Array.from(new Set(values)));
          }
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
  }, [sdk, isAuthenticated, model, view, fieldName]);

  return { suggestions, loading };
}
