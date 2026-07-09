import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'
import {
  LayoutDashboard, Search, Activity, Network,
  MessageSquare, FileText, Shield, LogOut, Cpu, FolderOpen
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/wallet-search',    icon: Search,          label: 'Wallet Search' },
  { to: '/wallet-history',   icon: Activity,        label: 'Transaction History' },
  { to: '/graph',            icon: Network,         label: 'Network Graph' },
  { to: '/assistant',        icon: MessageSquare,   label: 'AI Assistant' },
  { to: '/investigations',   icon: FolderOpen,      label: 'Investigations' },
  { to: '/reports',          icon: FileText,        label: 'Reports' },
]

const ADMIN_ITEMS = [
  { to: '/admin', icon: Shield, label: 'Admin Panel' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="scanline-overlay w-60 min-h-screen bg-cyber-surface border-r border-cyber-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="relative z-10 px-5 py-5 border-b border-cyber-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Cpu className="text-cyber-cyan" size={22} />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyber-cyan" />
            </span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight tracking-wide">CryptoTrace</h1>
            <p className="text-cyber-cyan text-xs font-mono">AI v2.0</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="relative z-10 px-5 py-3 border-b border-cyber-border/50">
        <p className="text-white text-xs font-medium truncate">{user?.name}</p>
        <p className="text-cyber-dim text-xs font-mono truncate">{user?.email}</p>
        <span className={clsx(
          'mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider',
          user?.role === 'admin'
            ? 'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30'
            : 'bg-cyber-blue/10 text-blue-400 border border-cyber-blue/30'
        )}>
          {user?.role}
        </span>
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
        <p className="text-cyber-dim text-[10px] uppercase tracking-widest px-2 mb-2 font-mono">Investigation</p>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150',
              isActive
                ? 'bg-cyber-blue/20 text-white border border-cyber-blue/30'
                : 'text-cyber-muted hover:text-white hover:bg-cyber-border/40'
            )}
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <p className="text-cyber-dim text-[10px] uppercase tracking-widest px-2 mt-4 mb-2 font-mono">Admin</p>
            {ADMIN_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150',
                  isActive
                    ? 'bg-cyber-blue/20 text-white border border-cyber-blue/30'
                    : 'text-cyber-muted hover:text-white hover:bg-cyber-border/40'
                )}
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="relative z-10 p-3 border-t border-cyber-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-cyber-muted hover:text-cyber-red hover:bg-cyber-red/10 transition-all duration-150"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
