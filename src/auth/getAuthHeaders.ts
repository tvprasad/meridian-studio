// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { config } from '../config';
import { getMsalInstance, loginRequest } from './msalConfig';

export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!config.authEnabled) return {};

  const msalInstance = getMsalInstance();
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) return {};

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: accounts[0],
    });
    // Personal Microsoft accounts (gmail.com, outlook.com) cannot use custom
    // API scopes for accessToken — the audience doesn't match AUTH_CLIENT_ID.
    // idToken audience IS the client ID, so it validates correctly on the backend.
    // Trade-off: idToken has 1-hour fixed lifetime; user re-authenticates after expiry.
    return { Authorization: `Bearer ${response.idToken}` };
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect(loginRequest);
    }
    return {};
  }
}
