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

  // Acquire an idToken using OIDC scopes only.
  //
  // Token flow for tvprasad@gmail.com (personal Microsoft account):
  //   - Account is an external user (#EXT#) in the Azure AD tenant
  //   - Personal account tokens always carry iss = .../9188040d.../v2.0 (MSA consumer tenant)
  //     regardless of which authority endpoint was used to sign in
  //   - idToken.aud = AUTH_CLIENT_ID (plain UUID) — matches backend validation
  //   - Backend AUTH_TENANT_ID must be 9188040d... to accept MSA issuer
  //
  // API scope (api://CLIENT_ID/.default) is intentionally NOT used here:
  //   - Access tokens have aud = "api://CLIENT_ID" (with api:// prefix)
  //   - Backend validates audience = plain UUID — would fail with InvalidAudience
  //   - OIDC scopes always succeed silently; API scope can cause InteractionRequiredAuthError
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
