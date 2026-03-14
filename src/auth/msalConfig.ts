// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { PublicClientApplication, type Configuration, LogLevel } from '@azure/msal-browser';
import { config } from '../config';

const msalConfig: Configuration = {
  auth: {
    clientId: config.azure.clientId,
    authority: config.azure.tenantId
      ? `https://login.microsoftonline.com/${config.azure.tenantId}`
      : 'https://login.microsoftonline.com/common',
    redirectUri: config.azure.redirectUri,
    postLogoutRedirectUri: config.azure.redirectUri,
  },
  cache: {
    cacheLocation: 'localStorage',
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Verbose,
      loggerCallback: (_level, message, containsPii) => {
        if (containsPii) return;
        console.log(`[MSAL] ${message}`);
      },
    },
  },
};

export const loginRequest = {
  scopes: config.azure.apiScope
    ? [config.azure.apiScope]
    : ['openid', 'profile', 'email'],
};

// Singleton — only instantiated when auth is enabled
let msalInstance: PublicClientApplication | null = null;

export function getMsalInstance(): PublicClientApplication {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }
  return msalInstance;
}
