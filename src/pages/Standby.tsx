// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../auth/useAuth';

/** Seconds on the Standby page before automatic sign-out. */
const LOGOUT_COUNTDOWN_S = 5 * 60;

const PRINCIPLES = [
  'Control precedes generation.',
  'Observability precedes scale.',
  'Governance precedes automation.',
  'Every retrieval is a trust decision.',
  'Confidence without calibration is noise.',
  'An audit trail is not overhead — it is the product.',
  'Structure gets you scale.',
];

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart'] as const;

/**
 * Standby — a zero-API parking page shown after 15 minutes of inactivity.
 *
 * - Rotating operational principles keep the screen alive.
 * - A countdown bar shows time remaining before automatic sign-out.
 * - Any user activity (or the Resume button) returns to the previous page.
 * - When the countdown reaches zero, logoutRedirect() is called.
 */
export function Standby() {
  const { logout, authEnabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo: string = (location.state as { returnTo?: string } | null)?.returnTo ?? '/';

  const [secondsLeft, setSecondsLeft] = useState(LOGOUT_COUNTDOWN_S);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumed = useRef(false);

  const resume = useCallback(() => {
    if (resumed.current) return;
    resumed.current = true;
    if (countdownRef.current) clearInterval(countdownRef.current);
    navigate(returnTo, { replace: true });
  }, [navigate, returnTo]);

  // Countdown — fires logout or fallback redirect on zero.
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          if (authEnabled) {
            void logout();
          } else {
            navigate('/', { replace: true });
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [logout, navigate, authEnabled]);

  // Rotate principle every 8 seconds.
  useEffect(() => {
    const id = setInterval(
      () => setQuoteIndex((i) => (i + 1) % PRINCIPLES.length),
      8000,
    );
    return () => clearInterval(id);
  }, []);

  // First user activity resumes the session.
  useEffect(() => {
    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, resume, { passive: true, once: true }),
    );
    return () => ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resume));
  }, [resume]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const pct = (secondsLeft / LOGOUT_COUNTDOWN_S) * 100;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Aurora ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-[80vw] h-[80vw] rounded-full bg-violet-600/15 blur-[120px] animate-[drift_12s_ease-in-out_infinite]" />
        <div className="absolute -bottom-1/3 -right-1/4 w-[60vw] h-[60vw] rounded-full bg-teal-500/10 blur-[100px] animate-[drift_15s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-1/4 right-1/3 w-[40vw] h-[40vw] rounded-full bg-orange-400/8 blur-[80px] animate-[drift_18s_ease-in-out_infinite_2s]" />
      </div>

      {/* Iridescent top accent — matches sign-in screen */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-violet-500 to-teal-400" />

      <div className="relative z-10 flex flex-col items-center gap-10 px-8 max-w-xl text-center">
        {/* Logo */}
        <div className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-lg">
          <img src="/vpllogo.jfif" alt="Meridian Studio" className="w-full h-full object-contain" />
        </div>

        {/* Rotating principle */}
        <div className="space-y-4 min-h-[5rem] flex flex-col items-center justify-center">
          <p className="text-[10px] uppercase tracking-widest text-white/25">
            Operational principle
          </p>
          <p
            key={quoteIndex}
            className="text-xl font-light text-white/65 leading-relaxed italic"
          >
            &ldquo;{PRINCIPLES[quoteIndex]}&rdquo;
          </p>
        </div>

        {/* Countdown */}
        <div className="w-full space-y-3">
          <p className="text-sm text-white/35">
            Signing out in{' '}
            <span className="font-mono text-white/55">
              {mins}:{secs}
            </span>
          </p>
          <div className="w-56 h-0.5 bg-white/10 rounded-full mx-auto overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-teal-400 transition-[width] duration-1000 ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Resume */}
        <button
          onClick={resume}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          Resume session
        </button>

        <p className="text-xs text-white/20">
          Move the mouse or press any key to return immediately.
        </p>
      </div>
    </div>
  );
}
