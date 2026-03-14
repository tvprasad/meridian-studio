// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { createContext } from 'react';
import type { AccountInfo } from '@azure/msal-browser';

export interface AuthContextValue {
  isAuthenticated: boolean;
  authEnabled: boolean;
  user: AccountInfo | null;
  roles: string[];
  getAccessToken: () => Promise<string | null>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
