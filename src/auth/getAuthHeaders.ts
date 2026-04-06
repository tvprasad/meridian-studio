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

  // Acquire an access token using the API scope.
  //
  // The API scope (api://CLIENT_ID/access_as_user) produces an access token where:
  //   - aud = AUTH_CLIENT_ID (plain UUID) — matches backend PyJWT audience validation
  //   - scp = "access_as_user" — confirms this is an access token, not an ID token
  //   - iss = .../9188040d.../v2.0 for personal MSA accounts (accepted by backend _valid_issuers)
  //
  // OIDC scopes (openid/profile/email) are included so idToken is also present
  // in the response — required for MSAL to maintain the signed-in session state.
  const scopes = config.azure.apiScope
    ? [config.azure.apiScope, 'openid', 'profile', 'email']
    : ['openid', 'profile', 'email'];

  try {
    const response = await msalInstance.acquireTokenSilent({ scopes, account });
    // Prefer access token (present when API scope is configured).
    // Fall back to idToken for local dev where VITE_AZURE_API_SCOPE is unset.
    const token = response.accessToken || response.idToken;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect({ scopes });
    }
    return {};
  }
}
