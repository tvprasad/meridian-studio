// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useEffect, useState, useCallback } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Database, Settings, Github, Languages, Eye, Mic, FileSearch, Pin, PinOff, Sun, Moon, Bot, BarChart3 } from 'lucide-react';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { useDiagnostics } from '../../hooks/useDiagnosticsHook';
import { version } from '../../../package.json';
import { UserProfile } from '../../auth/UserProfile';

const SIDEBAR_PINNED_KEY = 'meridian-sidebar-pinned';
const THEME_KEY = 'meridian-theme';

const coreNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/query', icon: MessageSquare, label: 'Ask Meridian' },
  { to: '/agent', icon: Bot, label: 'Ops Agent' },
  { to: '/ingest', icon: Database, label: 'Ingest' },
  { to: '/evaluation', icon: BarChart3, label: 'Evaluation' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const aiNavItems = [
  { to: '/language', icon: Languages, label: 'Language' },
  { to: '/vision', icon: Eye, label: 'Vision' },
  { to: '/speech', icon: Mic, label: 'Speech' },
  { to: '/document', icon: FileSearch, label: 'Document' },
];

function NavItem({ to, icon: Icon, label, collapsed }: { to: string; icon: React.ElementType; label: string; collapsed: boolean }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center py-2.5 text-sm transition-colors ${
          collapsed ? 'justify-center px-3' : 'px-6'
        } ${
          isActive
            ? `bg-white/10 border-l-2 border-violet-400 ${collapsed ? 'pl-2.5' : 'pl-[22px]'}`
            : 'hover:bg-white/5'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`w-4 h-4 shrink-0 transition-colors ${collapsed ? '' : 'mr-3'} ${isActive ? 'text-white' : 'text-white/65'}`} />
          {!collapsed && (
            <span className={`iridescent-on-hover truncate ${isActive ? 'text-white' : 'text-white/65'}`}>
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

const AI_ROUTES = ['/language', '/vision', '/speech', '/document'];

export function Layout() {
  const { pathname } = useLocation();
  const showDiagnostics = AI_ROUTES.some((r) => pathname.startsWith(r));
  const { reset } = useDiagnostics();

  // Sidebar pin state — persisted in localStorage
  const [pinned, setPinned] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_PINNED_KEY);
    return stored === null ? true : stored === 'true';
  });
  const [hovered, setHovered] = useState(false);

  const togglePin = useCallback(() => {
    setPinned((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_PINNED_KEY, String(next));
      return next;
    });
  }, []);

  // Sidebar is expanded when pinned OR hovered (while unpinned)
  const expanded = pinned || hovered;

  // Dark mode — persisted in localStorage, applied on <html>
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  const toggleTheme = useCallback(() => setDark((prev) => !prev), []);

  // Reset diagnostics & governance when navigating between AI service pages
  useEffect(() => {
    if (showDiagnostics) reset();
  }, [pathname, showDiagnostics, reset]);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`bg-black text-white flex flex-col shrink-0 transition-all duration-200 ease-in-out ${expanded ? 'w-64' : 'w-14'}`}
        onMouseEnter={() => { if (!pinned) setHovered(true); }}
        onMouseLeave={() => { if (!pinned) setHovered(false); }}
      >
        {/* Iridescent top accent strip — warm core to cool edge */}
        <div className="h-0.5 bg-gradient-to-r from-orange-400 via-violet-500 to-teal-400 shrink-0" />
        <div className={`border-b border-white/10 ${expanded ? 'p-6' : 'py-4 px-2'}`}>
          <div className={`flex items-center ${expanded ? 'gap-3' : 'justify-center'}`}>
            <a href="https://vplsolutions.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-lg block">
              <img src="/logo.png" alt="VPL" className="w-full h-full object-contain" />
            </a>
            {expanded && (
              <div className="iridescent-group flex-1 min-w-0">
                <h1 className="text-base font-bold leading-tight iridescent-text">
                  Meridian Studio
                </h1>
                <p className="text-white/40 text-xs mt-0.5">Governed AI Platform</p>
              </div>
            )}
          </div>
        </div>

        <nav className="mt-2 flex-1 overflow-y-auto">
          {coreNavItems.map((item) => (
            <NavItem key={item.to} {...item} collapsed={!expanded} />
          ))}

          {expanded ? (
            <div className="px-6 pt-5 pb-1 flex items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">AI Lab</p>
              <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400">Preview</span>
            </div>
          ) : (
            <div className="mx-2 my-3 border-t border-white/10" />
          )}

          {aiNavItems.map((item) => (
            <NavItem key={item.to} {...item} collapsed={!expanded} />
          ))}
        </nav>

        {/* Pin + Theme toggles */}
        <div className={`border-t border-white/10 ${expanded ? 'px-6 py-3 flex items-center justify-between' : 'py-3 flex flex-col items-center gap-2'}`}>
          <button
            onClick={togglePin}
            title={pinned ? 'Unpin sidebar' : 'Pin sidebar'}
            className="flex items-center gap-2 text-xs text-white/50 hover:text-white/90 transition-colors"
          >
            {pinned ? (
              <>
                <Pin className="w-3.5 h-3.5 shrink-0" />
                {expanded && <span>Pinned</span>}
              </>
            ) : (
              <>
                <PinOff className="w-3.5 h-3.5 shrink-0" />
                {expanded && <span>Unpinned</span>}
              </>
            )}
          </button>
          <button
            onClick={toggleTheme}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex items-center gap-2 text-xs text-white/50 hover:text-white/90 transition-colors"
          >
            {dark ? (
              <>
                <Sun className="w-3.5 h-3.5 shrink-0" />
                {expanded && <span>Light</span>}
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 shrink-0" />
                {expanded && <span>Dark</span>}
              </>
            )}
          </button>
        </div>

        <UserProfile collapsed={!expanded} />

        {expanded && (
          <div className="px-6 pb-6 space-y-2 shrink-0">
            {/* Version + GitHub */}
            <a
              href="https://github.com/tvprasad/meridian-studio/releases"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs opacity-70 hover:opacity-100 transition-opacity iridescent-text"
              title="View releases on GitHub"
            >
              v{version}
              <Github className="w-3 h-3" />
            </a>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col bg-gray-50 dark:bg-gray-950">
        <div className="flex-1 p-8">
          <Outlet />
        </div>
        <footer className="px-8 py-3 border-t border-gray-100 dark:border-white/10">
          <p className="text-[8px] text-gray-400/70 dark:text-gray-600 leading-relaxed">
            Microsoft Azure, Amazon Web Services (AWS), and all other third-party product names, logos, and brands are trademarks or registered trademarks of their respective owners. Their use here does not imply endorsement or affiliation.
          </p>
        </footer>
      </main>

      {/* Right sidebar — Diagnostics & Governance (AI pages only) */}
      {showDiagnostics && <DiagnosticsPanel />}
    </div>
  );
}
