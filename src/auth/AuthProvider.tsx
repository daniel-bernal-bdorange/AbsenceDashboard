import type { PropsWithChildren } from 'react';

import { MsalProvider } from '@azure/msal-react';

import { msalInstance } from './msalConfig';

export function AuthProvider({ children }: PropsWithChildren) {
  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
