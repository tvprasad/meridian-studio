// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionRequiredAuthError, type AccountInfo } from '@azure/msal-browser';
import { AuthContext, type AuthContextValue } from './AuthContext';
import { getMsalInstance, loginRequest } from './msalConfig';
import { config } from '../config';

// ── Disabled auth: everything is open ────────────────────────────────────────

function DisabledAuthProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: true,
      authEnabled: false,
      user: null,
      roles: ['operator'],
      getAccessToken: async () => null,
      login: async () => {},
      logout: async () => {},
    }),
    [],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Enabled auth: real MSAL integration ──────────────────────────────────────

function MsalAuthInner({ children }: { children: ReactNode }) {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const account: AccountInfo | null = accounts[0] ?? null;

  const roles = useMemo(() => {
    const claims = account?.idTokenClaims as Record<string, unknown> | undefined;
    const raw = claims?.roles;
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [account]);

  const getAccessToken = useCallback(async () => {
    if (!account) return null;
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        try {
          const result = await instance.acquireTokenPopup(loginRequest);
          return result.accessToken;
        } catch {
          // Popup blocked or failed — fall back to redirect
          await instance.acquireTokenRedirect(loginRequest);
          return null;
        }
      }
      return null;
    }
  }, [instance, account]);

  const login = useCallback(async () => {
    await instance.loginRedirect(loginRequest);
  }, [instance]);

  const logout = useCallback(async () => {
    await instance.logoutRedirect({
      postLogoutRedirectUri: config.azure.redirectUri,
    });
  }, [instance]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      authEnabled: true,
      user: account,
      roles,
      getAccessToken,
      login,
      logout,
    }),
    [isAuthenticated, account, roles, getAccessToken, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function EnabledAuthProvider({ children }: { children: ReactNode }) {
  const [msalReady, setMsalReady] = useState(false);
  const msalInstance = getMsalInstance();

  useEffect(() => {
    msalInstance
      .initialize()
      .then(() => msalInstance.handleRedirectPromise())
      .then((result) => {
        // After redirect login, result.account is the signed-in account — set it active so
        // getActiveAccount() returns a value before React Query fires any API calls.
        if (result?.account) {
          msalInstance.setActiveAccount(result.account);
        } else {
          // On non-redirect page loads (refresh / direct navigation), restore active account
          // from MSAL cache if exactly one account exists.
          const cached = msalInstance.getAllAccounts();
          if (cached.length > 0) {
            msalInstance.setActiveAccount(cached[0]);
          }
        }
        setMsalReady(true);
      })
      .catch((err) => {
        console.error('[MSAL] Redirect handling failed:', err);
        setMsalReady(true); // still render so app isn't stuck
      });
  }, [msalInstance]);

  if (!msalReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <MsalAuthInner>{children}</MsalAuthInner>
    </MsalProvider>
  );
}

// ── Public export: picks the right provider based on feature flag ─────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  if (config.authEnabled) {
    return <EnabledAuthProvider>{children}</EnabledAuthProvider>;
  }
  return <DisabledAuthProvider>{children}</DisabledAuthProvider>;
}
