import { useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const PAGE_TITLES = {
  '/dashboard':      'Dashboard',
  '/wallet-search':  'Wallet Search',
  '/wallet-history': 'Transaction History',
  '/investigations': 'Investigations',
  '/graph':          'Network Graph',
  '/assistant':      'AI Assistant',
  '/reports':        'Reports',
  '/admin':          'Admin Panel',
}

export default function Header() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const title = PAGE_TITLES[pathname] ?? 'CryptoTrace AI'

  return (
    <header className="h-14 border-b border-cyber-border bg-cyber-surface/60 backdrop-blur flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1">
        <h2 className="text-white font-semibold text-sm">{title}</h2>
        <p className="text-cyber-dim text-xs font-mono">
          {new Date().toUTCString().replace('GMT', 'UTC')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-cyber-border text-cyber-dim text-xs font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-cyber-green animate-pulse-slow" />
          LIVE
        </div>
        <div className="h-7 w-px bg-cyber-border" />
        <div className="text-right">
          <p className="text-white text-xs font-medium">{user?.name}</p>
          <p className="text-cyber-dim text-[10px] font-mono uppercase">{user?.role}</p>
        </div>
      </div>
    </header>
  )
}
