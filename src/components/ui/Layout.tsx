import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Upload, Settings, Github, Linkedin } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/query', icon: MessageSquare, label: 'Query' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Layout() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white flex flex-col">
        {/* Iridescent top accent strip — warm core to cool edge */}
        <div className="h-0.5 bg-gradient-to-r from-orange-400 via-violet-500 to-teal-400 shrink-0" />
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-lg">
              <img src="/vpllogo.jfif" alt="VPL" className="w-full h-full object-contain" />
            </div>
            <div className="iridescent-group">
              <h1 className="text-base font-bold leading-tight iridescent-text">
                Meridian Studio
              </h1>
              <p className="text-white/40 text-xs mt-0.5">Governed AI Platform</p>
            </div>
          </div>
        </div>

        <nav className="mt-2 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-white/10 border-l-2 border-violet-400 pl-[22px]'
                    : 'hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-white' : 'text-white/40'}`} />
                  <span className={`iridescent-on-hover ${isActive ? 'text-white' : 'text-white/40'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10 space-y-2">
          {/* Version → releases */}
          <a
            href="https://github.com/tvprasad/meridian/releases"
            target="_blank"
            rel="noreferrer"
            className="block text-xs opacity-50 hover:opacity-100 transition-opacity iridescent-text"
          >
            v0.1.0
          </a>

          {/* Name + social icons */}
          <div className="flex items-center justify-between">
            <span className="text-xs opacity-50 iridescent-text">
              Prasad Thiriveedi
            </span>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/tvprasad/"
                target="_blank"
                rel="noreferrer"
                className="opacity-30 hover:opacity-80 transition-opacity"
                style={{ color: '#a78bfa' }}
                title="GitHub"
              >
                <Github className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://www.linkedin.com/in/-prasad"
                target="_blank"
                rel="noreferrer"
                className="opacity-30 hover:opacity-80 transition-opacity"
                style={{ color: '#2dd4bf' }}
                title="LinkedIn"
              >
                <Linkedin className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Repo links */}
          <div className="flex items-center gap-1.5 text-xs">
            <a
              href="https://github.com/tvprasad/meridian"
              target="_blank"
              rel="noreferrer"
              className="opacity-30 hover:opacity-80 transition-opacity iridescent-text"
            >
              meridian
            </a>
            <span className="text-white/20">·</span>
            <a
              href="https://github.com/tvprasad/meridian-studio"
              target="_blank"
              rel="noreferrer"
              className="opacity-30 hover:opacity-80 transition-opacity iridescent-text"
            >
              studio
            </a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <div className="flex-1 p-8">
          <Outlet />
        </div>
        <footer className="px-8 py-3 border-t border-gray-100">
          <p className="text-[8px] text-gray-400/70 leading-relaxed">
            Microsoft Azure, Amazon Web Services (AWS), and all other third-party product names, logos, and brands are trademarks or registered trademarks of their respective owners. Their use here does not imply endorsement or affiliation.
          </p>
        </footer>
      </main>
    </div>
  );
}