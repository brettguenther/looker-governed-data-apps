import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Looker40SDK } from '@looker/sdk/lib/4.0/methods';
import type { LookerUser } from '../../types/looker';
import { getLookerSDK, getLookerSession, resetLookerSession } from './session';

interface LookerAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: LookerUser | null;
  error: string | null;
  sdk: Looker40SDK;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  handleAuthCallback: (code: string) => Promise<void>;
}

const LookerAuthContext = createContext<LookerAuthContextType | undefined>(undefined);

export const LookerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<LookerUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sdk = getLookerSDK();
  const session = getLookerSession();

  const fetchUserProfile = useCallback(async (): Promise<boolean> => {
    try {
      const meResponse = await sdk.me('id,first_name,last_name,display_name,email,avatar_url,role_ids');
      if (meResponse.ok && meResponse.value) {
        setUser(meResponse.value);
        setIsAuthenticated(true);
        setError(null);
        return true;
      } else {
        if (!meResponse.ok) {
          console.warn('sdk.me() returned error:', meResponse.error);
        }
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user profile';
      console.warn('Could not fetch user profile:', message);
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  }, [sdk]);

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        session.restoreStoredToken();
        if (session.isAuthenticated()) {
          const success = await fetchUserProfile();
          if (!success) {
            // Try refreshing token once
            if (session.activeToken?.refresh_token) {
              await session.getToken();
              await fetchUserProfile();
            }
          }
        } else if (session.activeToken?.refresh_token) {
          try {
            await session.getToken();
            if (session.isAuthenticated()) {
              await fetchUserProfile();
            }
          } catch {
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Auth verification failed';
        setError(message);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [session, fetchUserProfile]);

  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const authUrl = await session.createAuthCodeRequestUrl('cors_api', 'LookerGenDataApps');
      window.location.href = authUrl;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login initialization failed';
      setError(message);
      setIsLoading(false);
    }
  }, [session]);

  const handleAuthCallback = useCallback(async (code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await session.redeemAuthCode(code);
      const profileSuccess = await fetchUserProfile();
      if (!profileSuccess) {
        // Even if me() had an issue, if token is valid, mark authenticated
        if (session.isAuthenticated()) {
          setIsAuthenticated(true);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'OAuth code redemption failed';
      setError(message);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session, fetchUserProfile]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await session.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      resetLookerSession();
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      window.location.href = window.location.origin;
    }
  }, [session]);

  return (
    <LookerAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        error,
        sdk,
        login,
        logout,
        handleAuthCallback,
      }}
    >
      {children}
    </LookerAuthContext.Provider>
  );
};

export const useLookerAuth = (): LookerAuthContextType => {
  const context = useContext(LookerAuthContext);
  if (!context) {
    throw new Error('useLookerAuth must be used within a LookerAuthProvider');
  }
  return context;
};
