import type { AccountInfo } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';

import { appEnv, isAuthConfigured } from '../config/env';

import { loginRequest } from './msalConfig';

const autoLoginRequestKey = 'ob-dashboard:auto-login-requested';
const autoLoginSuppressedKey = 'ob-dashboard:auto-login-suppressed';

type GroupClaims = {
  groups?: string[];
  hasgroups?: boolean;
};

const clearSessionFlag = (key: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(key);
};

const setSessionFlag = (key: string, value: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(key, value);
};

const hasGroupAccess = (account: AccountInfo | null) => {
  if (!appEnv.aadGroupId) {
    return true;
  }

  const claims = account?.idTokenClaims as GroupClaims | undefined;
  const groups = claims?.groups ?? [];

  return groups.includes(appEnv.aadGroupId);
};

export function useAuth() {
  const { accounts, instance, inProgress } = useMsal();

  const account = accounts[0] ?? null;
  const isAuthenticated = accounts.length > 0;
  const isAccessControlConfigured = Boolean(appEnv.aadGroupId);
  const hasAccess = hasGroupAccess(account);
  const isAccessDenied = isAuthenticated && isAccessControlConfigured && !hasAccess;

  const signIn = async () => {
    if (!isAuthConfigured) {
      return;
    }

    clearSessionFlag(autoLoginSuppressedKey);
    await instance.loginRedirect(loginRequest);
  };

  const signOut = async () => {
    if (!isAuthConfigured) {
      return;
    }

    setSessionFlag(autoLoginSuppressedKey, 'true');
    clearSessionFlag(autoLoginRequestKey);
    await instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
  };

  return {
    account,
    hasAccess,
    isAccessControlConfigured,
    isAccessDenied,
    inProgress,
    isAuthenticated,
    isAuthConfigured,
    signIn,
    signOut,
  };
}
