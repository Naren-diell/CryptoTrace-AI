import { useEffect, useState } from 'react'
import { adminApi } from '../services/walletApi'
import { StatCard, RiskBadge, PageLoader, Alert } from '../components/ui'
import { formatUsd } from '../utils/format'
import { useAuth } from '../context/AuthContext'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Database, Wallet, AlertTriangle, TrendingUp,
  Shield, Activity, Search, FileText
} from 'lucide-react'
import { Link } from 'react-router-dom'

const RISK_COLORS = { low: '#00C853', medium: '#FFD600', high: '#EF5350' }
const CHAIN_COLORS = { bitcoin: '#F7931A', ethereum: '#627EEA' }

// Fallback demo stats shown when user is not admin (no access to /admin/dashboard)
const DEMO_STATS = {
  totalTransactions: 0,
  totalWallets: 0,
  highRiskWallets: 0,
  totalVolumeUsd: 0,
  riskDistribution: [
    { risk_level: 'low', count: 0 },
    { risk_level: 'medium', count: 0 },
    { risk_level: 'high', count: 0 },
  ],
  chainDistribution: [
    { chain: 'bitcoin', count: 0 },
    { chain: 'ethereum', count: 0 },
  ]
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-cyber-card border border-cyber-border rounded-lg px-3 py-2 text-xs font-mono shadow-glow">
      <p className="text-cyber-cyan mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || p.fill }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { user }              = useAuth()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!isAdmin) { setStats(DEMO_STATS); setLoading(false); return }
    adminApi.getDashboard()
      .then(r => setStats(r.data.data))
      .catch(() => setError('Could not load dashboard stats.'))
      .finally(() => setLoading(false))
  }, [isAdmin])

  if (loading) return <PageLoader />

  const riskPieData = (stats?.riskDistribution ?? []).map(r => ({
    name: r.risk_level,
    value: Number(r.count),
    fill: RISK_COLORS[r.risk_level] ?? '#B0BEC5'
  }))

  const chainBarData = (stats?.chainDistribution ?? []).map(c => ({
    name: c.chain === 'bitcoin' ? 'Bitcoin' : 'Ethereum',
    wallets: Number(c.count),
    fill: CHAIN_COLORS[c.chain] ?? '#B0BEC5'
  }))

  return (
    <div className="space-y-6">
      {error && <Alert type="warning" message={error} />}

      {!isAdmin && (
        <Alert type="info" message="Dashboard analytics require admin access. Start by searching a wallet address below." />
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Transactions" value={Number(stats?.totalTransactions ?? 0).toLocaleString()} icon={Database} accent="#00E5FF" />
        <StatCard label="Wallets Analysed"   value={Number(stats?.totalWallets ?? 0).toLocaleString()}      icon={Wallet}   accent="#1565C0" />
        <StatCard label="High Risk Wallets"  value={Number(stats?.highRiskWallets ?? 0).toLocaleString()}   icon={AlertTriangle} accent="#EF5350" />
        <StatCard label="Total Volume"       value={formatUsd(stats?.totalVolumeUsd ?? 0)}                  icon={TrendingUp}    accent="#00C853" />
      </div>

      {/* Charts row */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Risk distribution donut */}
          <div className="card">
            <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
              <Shield size={16} className="text-cyber-cyan" /> Risk Distribution
            </h3>
            {riskPieData.every(d => d.value === 0) ? (
              <p className="text-cyber-muted text-sm text-center py-10">No analysis data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {riskPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={v => <span className="text-cyber-muted text-xs capitalize">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Chain distribution bar */}
          <div className="card">
            <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
              <Activity size={16} className="text-cyber-cyan" /> Wallets by Chain
            </h3>
            {chainBarData.every(d => d.wallets === 0) ? (
              <p className="text-cyber-muted text-sm text-center py-10">No wallet data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chainBarData} barSize={40}>
                  <XAxis dataKey="name" tick={{ fill: '#B0BEC5', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#B0BEC5', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="wallets" radius={[4, 4, 0, 0]}>
                    {chainBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="card">
        <h3 className="text-white font-medium text-sm mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/wallet-search" className="flex items-center gap-3 p-4 rounded-lg border border-cyber-border hover:border-cyber-blue/40 hover:bg-cyber-blue/5 transition-all group">
            <Search size={20} className="text-cyber-cyan shrink-0" />
            <div>
              <p className="text-white text-sm font-medium group-hover:text-cyber-cyan transition-colors">Search Wallet</p>
              <p className="text-cyber-muted text-xs">Analyse BTC or ETH address</p>
            </div>
          </Link>
          <Link to="/investigations" className="flex items-center gap-3 p-4 rounded-lg border border-cyber-border hover:border-cyber-blue/40 hover:bg-cyber-blue/5 transition-all group">
            <FileText size={20} className="text-cyber-cyan shrink-0" />
            <div>
              <p className="text-white text-sm font-medium group-hover:text-cyber-cyan transition-colors">New Investigation</p>
              <p className="text-cyber-muted text-xs">Create and manage cases</p>
            </div>
          </Link>
          <Link to="/reports" className="flex items-center gap-3 p-4 rounded-lg border border-cyber-border hover:border-cyber-blue/40 hover:bg-cyber-blue/5 transition-all group">
            <Shield size={20} className="text-cyber-cyan shrink-0" />
            <div>
              <p className="text-white text-sm font-medium group-hover:text-cyber-cyan transition-colors">Generate Report</p>
              <p className="text-cyber-muted text-xs">Export PDF or Excel</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
