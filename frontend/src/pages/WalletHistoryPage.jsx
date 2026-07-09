import { useState } from 'react'
import { walletApi } from '../services/walletApi'
import { RiskBadge, ChainBadge, Alert, Spinner, PageLoader, EmptyState, CopyButton } from '../components/ui'
import { truncateAddress, formatNumber, formatUsd, formatDate } from '../utils/format'
import { Search, Activity, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-cyber-card border border-cyber-border rounded-lg px-3 py-2 text-xs font-mono shadow-glow">
      <p className="text-cyber-cyan">{label}</p>
      <p className="text-white">Amount: {payload[0]?.value}</p>
    </div>
  )
}

export default function WalletHistoryPage() {
  const [address, setAddress]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [data, setData]           = useState(null)
  const [filterDir, setFilterDir] = useState('all') // all | in | out

  async function handleSearch(e) {
    e.preventDefault()
    if (!address.trim()) return
    setError(''); setData(null); setLoading(true)
    try {
      const res = await walletApi.getHistory(address.trim())
      setData(res.data.data)
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Lookup failed.'
      setError(msg.includes('Search it first')
        ? 'This address has not been analysed yet. Go to Wallet Search first.'
        : msg)
    } finally {
      setLoading(false)
    }
  }

  // Build timeline chart data
  const chartData = (data?.transactions ?? [])
    .slice().reverse()
    .map(tx => ({
      date: new Date(tx.tx_timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: parseFloat(tx.amount) || 0
    }))

  const filteredTxs = (data?.transactions ?? []).filter(tx => {
    if (filterDir === 'all') return true
    if (filterDir === 'in')  return tx.to_address === data.wallet.address
    if (filterDir === 'out') return tx.from_address === data.wallet.address
    return true
  })

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="card">
        <h2 className="text-white font-semibold mb-1">Transaction History</h2>
        <p className="text-cyber-muted text-sm mb-5">
          Look up a previously analysed wallet to view its stored transaction timeline.
          Addresses must be searched first on the Wallet Search page.
        </p>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            className="input font-mono flex-1"
            placeholder="Enter wallet address…"
            value={address}
            onChange={e => setAddress(e.target.value)}
            spellCheck={false}
          />
          <button type="submit" disabled={loading || !address.trim()} className="btn-primary flex items-center gap-2">
            {loading ? <Spinner size="sm" /> : <Search size={16} />}
            {loading ? 'Loading…' : 'Load History'}
          </button>
        </form>
        {error && <Alert type="error" message={error} className="mt-4" />}
      </div>

      {loading && <PageLoader />}

      {data && (
        <div className="space-y-4 animate-slide-up">
          {/* Wallet header */}
          <div className="card flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <ChainBadge chain={data.wallet.chain} />
                {data.risk && <RiskBadge level={data.risk.risk_level} />}
              </div>
              <p className="address">{data.wallet.address} <CopyButton value={data.wallet.address} /></p>
            </div>
            <div className="grid grid-cols-3 gap-6 text-right shrink-0">
              <div>
                <p className="text-cyber-dim text-[10px] font-mono uppercase">Balance</p>
                <p className="text-white font-mono">{formatNumber(data.wallet.balance, 6)}</p>
              </div>
              <div>
                <p className="text-cyber-dim text-[10px] font-mono uppercase">Transactions</p>
                <p className="text-white font-mono">{data.wallet.total_tx_count}</p>
              </div>
              <div>
                <p className="text-cyber-dim text-[10px] font-mono uppercase">USD Value</p>
                <p className="text-white font-mono">{formatUsd(data.wallet.balance_usd)}</p>
              </div>
            </div>
          </div>

          {/* Timeline chart */}
          {chartData.length > 1 && (
            <div className="card">
              <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
                <Activity size={15} className="text-cyber-cyan" /> Transaction Volume Timeline
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="amtGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00E5FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#B0BEC5', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#B0BEC5', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="amount" stroke="#00E5FF" strokeWidth={1.5} fill="url(#amtGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Transaction table */}
          <div className="card">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <h3 className="text-white font-medium text-sm">
                Transactions <span className="text-cyber-dim font-mono">({filteredTxs.length})</span>
              </h3>
              <div className="flex gap-1.5">
                {['all', 'in', 'out'].map(dir => (
                  <button
                    key={dir}
                    onClick={() => setFilterDir(dir)}
                    className={`px-3 py-1 rounded text-xs font-mono uppercase transition-all ${
                      filterDir === dir
                        ? 'bg-cyber-blue/30 text-white border border-cyber-blue/40'
                        : 'text-cyber-muted hover:text-white border border-transparent'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>

            {filteredTxs.length === 0 ? (
              <EmptyState icon={Activity} title="No transactions found" description="Try a different direction filter." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-cyber-border text-cyber-dim font-mono">
                      <th className="text-left pb-2 pr-3">Dir</th>
                      <th className="text-left pb-2 pr-3">Tx Hash</th>
                      <th className="text-left pb-2 pr-3">From</th>
                      <th className="text-left pb-2 pr-3">To</th>
                      <th className="text-right pb-2 pr-3">Amount</th>
                      <th className="text-right pb-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxs.map((tx, i) => {
                      const isIn = tx.to_address === data.wallet.address
                      return (
                        <tr key={i} className="border-b border-cyber-border/30 hover:bg-cyber-surface/30 transition-colors">
                          <td className="py-2 pr-3">
                            {isIn
                              ? <ArrowDownLeft size={14} className="text-cyber-green" />
                              : <ArrowUpRight size={14} className="text-cyber-red" />
                            }
                          </td>
                          <td className="py-2 pr-3"><span className="hash">{truncateAddress(tx.tx_hash, 6)}</span></td>
                          <td className="py-2 pr-3"><span className="hash">{truncateAddress(tx.from_address, 6)}</span></td>
                          <td className="py-2 pr-3"><span className="hash">{truncateAddress(tx.to_address, 6)}</span></td>
                          <td className="py-2 pr-3 text-right font-mono text-white">{formatNumber(tx.amount, 6)}</td>
                          <td className="py-2 text-right text-cyber-muted">{formatDate(tx.tx_timestamp)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
