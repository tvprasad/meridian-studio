// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { config } from '../config';
import { getMsalInstance, loginRequest } from './msalConfig';

export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!config.authEnabled) return {};

  const msalInstance = getMsalInstance();

  // Prefer active account; fall back to first account in cache.
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
  if (!account) return {};

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });
    // Use idToken — audience is AUTH_CLIENT_ID, issuer is login.microsoftonline.com.
    // Personal account accessTokens use sts.windows.net issuer which the backend rejects.
    return { Authorization: `Bearer ${response.idToken}` };
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect(loginRequest);
    }
    return {};
  }
}
