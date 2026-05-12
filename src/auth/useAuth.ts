import { useMsal } from '@azure/msal-react';

import { isAuthConfigured } from '../config/env';

import { loginRequest } from './msalConfig';

export function useAuth() {
  const { accounts, instance, inProgress } = useMsal();

  const account = accounts[0] ?? null;
  const isAuthenticated = accounts.length > 0;

  const signIn = async () => {
    if (!isAuthConfigured) {
      return;
    }

    await instance.loginRedirect(loginRequest);
  };

  const signOut = async () => {
    if (!isAuthConfigured) {
      return;
    }

    await instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
  };

  return {
    account,
    inProgress,
    isAuthenticated,
    isAuthConfigured,
    signIn,
    signOut,
  };
}
