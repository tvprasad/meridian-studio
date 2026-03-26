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

  // Request only OIDC scopes — we need idToken, not an API access token.
  // Using the API scope (api://xxx/.default) triggers InteractionRequiredAuthError
  // for personal Microsoft accounts because app-role consent is not pre-granted at
  // the tenant level, causing the catch block to fire and return {} (no token).
  // OIDC scopes are always silently available for any account type.
  const oidcScopes = ['openid', 'profile', 'email'];

  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes: oidcScopes,
      account,
    });
    // Use idToken — audience is AUTH_CLIENT_ID, issuer is login.microsoftonline.com.
    // Personal account accessTokens use sts.windows.net issuer which the backend rejects.
    if (!response.idToken) return {};
    return { Authorization: `Bearer ${response.idToken}` };
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect({ scopes: oidcScopes });
    }
    return {};
  }
}
