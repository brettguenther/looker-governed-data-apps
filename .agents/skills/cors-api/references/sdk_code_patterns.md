# Looker TypeScript SDK CORS & OAuth Code Patterns

This document contains standardized, production-ready TypeScript recipes for integrating `@looker/sdk` and `@looker/sdk-rtl` into browser applications using CORS OAuth with PKCE.

---

## 1. Looker Settings & Persistent OAuth Session

Looker's default `@looker/sdk-rtl` `OAuthSession` stores tokens in memory. To survive page refreshes and SPA navigations, implement a `PersistentOAuthSession` subclass that syncs tokens with `sessionStorage`.

```typescript
import { Looker40SDK } from '@looker/sdk/lib/4.0/methods';
import {
  BrowserServices,
  OAuthSession,
  AuthToken,
  type IApiSettings,
  type IApiSection,
} from '@looker/sdk-rtl';

const TOKEN_STORAGE_KEY = 'looker_oauth_token_data';

export class BrowserOAuthSettings implements IApiSettings {
  base_url: string;
  looker_url: string;
  client_id: string;
  redirect_uri: string;
  verify_ssl: boolean = true;
  timeout: number = 120;
  agentTag: string = 'LookerGenDataApps/1.0';

  constructor(config: { baseUrl: string; clientId: string; redirectUri: string }) {
    this.base_url = config.baseUrl;
    this.looker_url = config.baseUrl;
    this.client_id = config.clientId;
    this.redirect_uri = config.redirectUri;
  }

  isConfigured(): boolean {
    return Boolean(this.base_url && this.client_id && this.redirect_uri);
  }

  readConfig(): IApiSection {
    return {
      base_url: this.base_url,
      looker_url: this.looker_url,
      client_id: this.client_id,
      redirect_uri: this.redirect_uri,
      verify_ssl: String(this.verify_ssl),
      timeout: String(this.timeout),
      agentTag: this.agentTag,
    };
  }
}

export class PersistentOAuthSession extends OAuthSession {
  constructor(services: BrowserServices) {
    super(services);
    this.restoreStoredToken();
  }

  restoreStoredToken(): void {
    try {
      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        const tokenData = JSON.parse(stored);
        if (tokenData?.access_token) {
          this.activeToken.setToken(tokenData);
          if (tokenData.expiresAt) {
            this.activeToken.expiresAt = new Date(tokenData.expiresAt);
          }
        }
      }
    } catch (err) {
      console.warn('Could not restore Looker OAuth token:', err);
    }
  }

  saveTokenToStorage(): void {
    try {
      if (this.activeToken?.access_token) {
        const tokenData = {
          access_token: this.activeToken.access_token,
          token_type: this.activeToken.token_type,
          expires_in: this.activeToken.expires_in,
          refresh_token: this.activeToken.refresh_token,
          expiresAt: this.activeToken.expiresAt?.toISOString(),
        };
        sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenData));
      } else {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('Could not persist Looker OAuth token:', err);
    }
  }

  async redeemAuthCode(authCode: string, codeVerifier?: string): Promise<AuthToken> {
    const token = await super.redeemAuthCode(authCode, codeVerifier);
    this.saveTokenToStorage();
    return token;
  }

  async getToken(): Promise<AuthToken> {
    if (!this.isAuthenticated() && !this.activeToken.access_token) {
      this.restoreStoredToken();
    }
    const token = await super.getToken();
    this.saveTokenToStorage();
    return token;
  }

  isAuthenticated(): boolean {
    if (!this.activeToken.isActive() && !this.activeToken.access_token) {
      this.restoreStoredToken();
    }
    return this.activeToken.isActive();
  }

  clearStorage(): void {
    super.clearStorage();
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  async logout(): Promise<boolean> {
    try {
      return await super.logout();
    } finally {
      this.clearStorage();
    }
  }
}
```

---

## 2. React Authentication Provider & Context

```typescript
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Looker40SDK } from '@looker/sdk/lib/4.0/methods';
import type { IUser } from '@looker/sdk/lib/4.0/models';

interface LookerAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: Partial<IUser> | null;
  error: string | null;
  sdk: Looker40SDK;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  handleAuthCallback: (code: string) => Promise<void>;
}

const LookerAuthContext = createContext<LookerAuthContextType | undefined>(undefined);

export const LookerAuthProvider: React.FC<{ children: React.ReactNode; sdk: Looker40SDK; session: PersistentOAuthSession }> = ({ children, sdk, session }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<Partial<IUser> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async (): Promise<boolean> => {
    try {
      const res = await sdk.me('id,first_name,last_name,display_name,email,avatar_url');
      if (res.ok && res.value) {
        setUser(res.value);
        setIsAuthenticated(true);
        setError(null);
        return true;
      }
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } catch {
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  }, [sdk]);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        session.restoreStoredToken();
        if (session.isAuthenticated()) {
          const ok = await fetchUserProfile();
          if (!ok && session.activeToken?.refresh_token) {
            await session.getToken();
            await fetchUserProfile();
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [session, fetchUserProfile]);

  const login = useCallback(async () => {
    const authUrl = await session.createAuthCodeRequestUrl('cors_api', 'LookerApp');
    window.location.href = authUrl;
  }, [session]);

  const handleAuthCallback = useCallback(async (code: string) => {
    await session.redeemAuthCode(code);
    await fetchUserProfile();
  }, [session, fetchUserProfile]);

  const logout = useCallback(async () => {
    await session.logout();
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = window.location.origin;
  }, [session]);

  return (
    <LookerAuthContext.Provider value={{ isAuthenticated, isLoading, user, error, sdk, login, logout, handleAuthCallback }}>
      {children}
    </LookerAuthContext.Provider>
  );
};

export const useLookerAuth = () => {
  const ctx = useContext(LookerAuthContext);
  if (!ctx) throw new Error('useLookerAuth must be used inside LookerAuthProvider');
  return ctx;
};
```

---

## 3. Reactive Looker Query Hook (`useLookerQuery`)

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLookerAuth } from '../auth/LookerAuthProvider';
import type { IWriteQuery } from '@looker/sdk/lib/4.0/models';

export interface LookerQueryPayload {
  model: string;
  view: string;
  fields: string[];
  filters?: Record<string, string>;
  sorts?: string[];
  limit?: string | number;
  pivots?: string[];
  dynamic_fields?: string | Array<Record<string, unknown>>;
  vis_config?: Record<string, unknown>;
}

export function useLookerQuery<T = Record<string, unknown>>(payload: LookerQueryPayload, enabled = true) {
  const { sdk, isAuthenticated } = useLookerAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);

  const payloadString = JSON.stringify(payload);
  const activeKeyRef = useRef<string | null>(null);

  const runQuery = useCallback(async () => {
    if (!isAuthenticated || !enabled) {
      setLoading(false);
      return;
    }

    const requestKey = `${payloadString}_${Date.now()}`;
    activeKeyRef.current = requestKey;

    setLoading(true);
    setError(null);
    const start = performance.now();

    try {
      const response = await sdk.run_inline_query({
        result_format: 'json',
        body: payload as unknown as IWriteQuery,
      });

      if (activeKeyRef.current !== requestKey) return; // Prevent stale overwrites

      setExecutionTimeMs(Math.round(performance.now() - start));

      if (response.ok) {
        let result = response.value;
        if (typeof result === 'string') {
          try {
            result = JSON.parse(result);
          } catch {
            // keep raw
          }
        }
        setData(Array.isArray(result) ? (result as T[]) : []);
      } else {
        throw new Error(JSON.stringify(response.error || 'Query failed'));
      }
    } catch (err: unknown) {
      if (activeKeyRef.current === requestKey) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setData([]);
      }
    } finally {
      if (activeKeyRef.current === requestKey) {
        setLoading(false);
      }
    }
  }, [sdk, isAuthenticated, enabled, payloadString, payload]);

  useEffect(() => {
    runQuery();
  }, [runQuery]);

  return { data, loading, error, refetch: runQuery, executionTimeMs, queryPayload: payload };
}
```
