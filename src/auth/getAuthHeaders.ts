// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { config } from '../config';
import { getMsalInstance } from './msalConfig';

export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!config.authEnabled) return {};

  const msalInstance = getMsalInstance();

  // Prefer active account; fall back to first account in cache.
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
  if (!account) return {};

  // Acquire an access token scoped to the Meridian API.
  // The scope must target the Meridian API's App Registration (VITE_AZURE_API_SCOPE =
  // api://011a079b.../.default) so MSAL returns a token the API will accept.
  // Requesting OIDC-only scopes (openid/profile/email) targets Microsoft Graph —
  // the resulting token has the wrong audience/signing key and the API returns 401.
  const apiScopes = config.azure.apiScope ? [config.azure.apiScope] : ['openid', 'profile', 'email'];

  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes: apiScopes,
      account,
    });
    if (!response.accessToken) return {};
    return { Authorization: `Bearer ${response.accessToken}` };
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect({ scopes: apiScopes });
    }
    return {};
  }
}
