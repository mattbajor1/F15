import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Nav() {
  const { pathname } = useLocation()
  const { logout } = useAuth()

  const Item = ({ to, label, icon }: { to: string; label: string; icon?: string }) => {
    const isActive = pathname === to
    return (
      <Link
        to={to}
        className={`
          relative px-4 py-2.5 rounded-lg font-medium
          transition-all duration-300 ease-in-out
          transform hover:scale-105
          ${
            isActive
              ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/40 border border-transparent'
          }
        `}
      >
        {icon && <span className="mr-2">{icon}</span>}
        <span>{label}</span>
        {isActive && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
        )}
      </Link>
    )
  }

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/50 shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
      <div className="relative max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-6">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-3 mr-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F15</span>
              </div>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Frame 15
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-2 flex-1">
            <Item to="/" label="Dashboard" icon="📊" />
            <Item to="/projects" label="Projects" icon="🎬" />
            <Item to="/inventory" label="Inventory" icon="📦" />
            <Item to="/marketing" label="AI Marketing" icon="✨" />
            <Item to="/documents" label="Documents" icon="📄" />
            <Item to="/settings" label="Settings" icon="⚙️" />
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="
              px-4 py-2.5 rounded-lg font-medium
              bg-slate-800/50 hover:bg-slate-700/50
              text-slate-300 hover:text-white
              border border-slate-700 hover:border-slate-600
              transition-all duration-300
              transform hover:scale-105
              shadow-md hover:shadow-lg
            "
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  )
}
