import clsx from 'clsx'
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const sz = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }[size]
  return (
    <div className={clsx('animate-spin rounded-full border-2 border-cyber-border border-t-cyber-cyan', sz, className)} />
  )
}

// ── PageLoader ────────────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-3" />
        <p className="text-cyber-muted text-sm font-mono">Fetching blockchain data…</p>
      </div>
    </div>
  )
}

// ── RiskBadge ─────────────────────────────────────────────────────────────────
export function RiskBadge({ level }) {
  const map = {
    low:    'risk-badge risk-low',
    medium: 'risk-badge risk-medium',
    high:   'risk-badge risk-high',
  }
  return <span className={map[level?.toLowerCase()] ?? 'risk-badge risk-medium'}>{level ?? 'unknown'}</span>
}

// ── ChainBadge ────────────────────────────────────────────────────────────────
export function ChainBadge({ chain }) {
  const isBtc = chain === 'bitcoin'
  return (
    <span className={clsx(
      'px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase',
      isBtc ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
             : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
    )}>
      {isBtc ? '₿ BTC' : 'Ξ ETH'}
    </span>
  )
}

// ── Alert ─────────────────────────────────────────────────────────────────────
const alertConfig = {
  error:   { icon: XCircle,        cls: 'border-cyber-red/40 bg-cyber-red/10 text-cyber-red' },
  warning: { icon: AlertTriangle,  cls: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' },
  success: { icon: CheckCircle,    cls: 'border-cyber-green/40 bg-cyber-green/10 text-cyber-green' },
  info:    { icon: Info,           cls: 'border-cyber-blue/40 bg-cyber-blue/10 text-cyber-cyan' },
}

export function Alert({ type = 'info', message, className = '' }) {
  if (!message) return null
  const { icon: Icon, cls } = alertConfig[type] ?? alertConfig.info
  return (
    <div className={clsx('flex items-start gap-3 border rounded-lg p-4 text-sm', cls, className)}>
      <Icon className="mt-0.5 shrink-0" size={16} />
      <span>{message}</span>
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="text-cyber-dim mb-4" size={48} />}
      <h3 className="text-white font-medium mb-1">{title}</h3>
      {description && <p className="text-cyber-muted text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, accent = '#00E5FF', delta }) {
  return (
    <div className="card flex items-start gap-4">
      <div className="p-2.5 rounded-lg" style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
        <Icon size={20} style={{ color: accent }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-cyber-muted text-xs uppercase tracking-widest mb-1 font-mono">{label}</p>
        <p className="text-white text-2xl font-semibold font-mono">{value}</p>
        {delta !== undefined && (
          <p className={clsx('text-xs mt-1', delta >= 0 ? 'text-cyber-green' : 'text-cyber-red')}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% vs yesterday
          </p>
        )}
      </div>
    </div>
  )
}

// ── CopyButton ────────────────────────────────────────────────────────────────
export function CopyButton({ value }) {
  const copy = () => navigator.clipboard.writeText(value)
  return (
    <button onClick={copy} title="Copy" className="text-cyber-dim hover:text-cyber-cyan transition-colors ml-1">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
      </svg>
    </button>
  )
}
