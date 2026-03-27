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

  // Acquire an idToken scoped to this app (OIDC scopes only).
  //
  // The backend validates:
  //   audience = AUTH_CLIENT_ID  (plain UUID — matches idToken.aud, NOT an accessToken aud)
  //   issuer   = .../AUTH_TENANT_ID/v2.0
  //
  // Using the API scope (api://CLIENT_ID/.default) fails with InteractionRequiredAuthError
  // because the app registration has no exposed API scopes — MSAL cannot silently acquire
  // a token for a scope the API hasn't declared.  OIDC scopes always succeed silently.
  //
  // VITE_AZURE_TENANT_ID must be the specific tenant (fa0a1e39...), NOT "common", so that
  // idToken.iss matches the backend's expected issuer.  With "common", personal accounts
  // receive iss=.../9188040d.../v2.0 (MSA tenant) which the backend rejects.
  const oidcScopes = ['openid', 'profile', 'email'];

  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes: oidcScopes,
      account,
    });
    if (!response.idToken) return {};
    return { Authorization: `Bearer ${response.idToken}` };
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect({ scopes: oidcScopes });
    }
    return {};
  }
}
