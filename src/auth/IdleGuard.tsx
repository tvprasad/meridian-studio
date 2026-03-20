// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useIdleTimer } from '../hooks/useIdleTimer';

/** 15 minutes of inactivity before redirecting to the Standby page. */
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * Wraps authenticated routes. After IDLE_TIMEOUT_MS of user inactivity,
 * redirects to /standby carrying the current path so the session can resume.
 * Only active when auth is enabled and the user is authenticated.
 */
export function IdleGuard({ children }: { children: ReactNode }) {
  const { authEnabled, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useIdleTimer({
    timeout: IDLE_TIMEOUT_MS,
    enabled: authEnabled && isAuthenticated,
    onIdle: () => {
      navigate('/standby', { state: { returnTo: location.pathname } });
    },
  });

  return <>{children}</>;
}
