import { useLookerAuth } from '../auth/LookerAuthProvider';
import type { Looker40SDK } from '@looker/sdk/lib/4.0/methods';

export const useLookerSDK = (): { sdk: Looker40SDK; isAuthenticated: boolean; isLoading: boolean } => {
  const { sdk, isAuthenticated, isLoading } = useLookerAuth();
  return { sdk, isAuthenticated, isLoading };
};
