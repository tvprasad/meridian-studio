// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';

const ACTIVITY_EVENTS = [
  'mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click',
] as const;

interface UseIdleTimerOptions {
  /** Milliseconds of inactivity before onIdle fires. */
  timeout: number;
  /** Called once when the idle threshold is reached. */
  onIdle: () => void;
  /** Set false to disable the timer entirely (e.g. when auth is off). */
  enabled?: boolean;
}

/**
 * Tracks user activity across the window. Fires onIdle after `timeout` ms
 * of silence. Resets automatically on any activity event.
 *
 * Returns a `reset` function to manually restart the countdown.
 */
export function useIdleTimer({ timeout, onIdle, enabled = true }: UseIdleTimerOptions) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep onIdle stable across re-renders without restarting the effect.
  const onIdleRef = useRef(onIdle);
  useLayoutEffect(() => {
    onIdleRef.current = onIdle;
  });

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onIdleRef.current(), timeout);
  }, [timeout]);

  useEffect(() => {
    if (!enabled) return;

    reset();

    const handleActivity = () => reset();
    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, handleActivity, { passive: true }),
    );

    return () => {
      if (timer.current) clearTimeout(timer.current);
      ACTIVITY_EVENTS.forEach((e) =>
        window.removeEventListener(e, handleActivity),
      );
    };
  }, [enabled, reset]);

  return { reset };
}
