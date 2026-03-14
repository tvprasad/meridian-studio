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
    return { Authorization: `Bearer ${response.accessToken}` };
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect(loginRequest);
    }
    return {};
  }
}
