import { type Configuration, LogLevel, PublicClientApplication } from '@azure/msal-browser';

import { appEnv } from '../config/env';

const msalConfig: Configuration = {
  auth: {
    clientId: appEnv.aadClientId,
    authority: appEnv.aadAuthority,
    redirectUri: appEnv.aadRedirectUri,
    postLogoutRedirectUri: appEnv.aadRedirectUri,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }

        if (level <= LogLevel.Warning) {
          console.warn(`[MSAL] ${message}`);
        }
      },
    },
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ['User.Read'],
};
