import { useState } from 'react'
import { walletApi } from '../services/walletApi'
import { RiskBadge, ChainBadge, Alert, Spinner, CopyButton } from '../components/ui'
import { truncateAddress, formatNumber, formatUsd, formatDate } from '../utils/format'
import { Search, AlertTriangle, Target, CheckCircle, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import clsx from 'clsx'

function IndicatorRow({ flag, detail }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-cyber-border/50 last:border-0">
      <AlertTriangle size={14} className="text-yellow-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-yellow-400 text-xs font-mono">{flag}</p>
        <p className="text-cyber-muted text-xs mt-0.5">{detail}</p>
      </div>
    </div>
  )
}

function HopStep({ step, index }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <span className="text-cyber-dim font-mono text-xs w-6 shrink-0">#{index}</span>
      <div className="flex-1 min-w-0">
        <span className="address text-xs">{truncateAddress(step.address, 10)}</span>
        {step.note && (
          <span className="ml-2 text-[10px] font-mono text-cyber-cyan bg-cyber-cyan/10 border border-cyber-cyan/20 rounded px-1.5 py-0.5">
            {step.note}
          </span>
        )}
      </div>
      {step.nextAddress && (
        <>
          <ArrowRight size={12} className="text-cyber-dim shrink-0" />
          <span className="text-cyber-muted font-mono text-xs">{formatNumber(step.amount, 6)}</span>
        </>
      )}
    </div>
  )
}

export default function WalletSearchPage() {
  const [address, setAddress]   = useState('')
  const [chain, setChain]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [result, setResult]     = useState(null)
  const [showHops, setShowHops] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    if (!address.trim()) return
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const res = await walletApi.search(address.trim(), chain || null)
      setResult(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Search failed. Check the address and try again.')
    } finally {
      setLoading(false)
    }
  }

  const { wallet, risk, endReceiver } = result ?? {}

  return (
    <div className="space-y-6">
      {/* Search form */}
      <div className="card">
        <h2 className="text-white font-semibold mb-1">Wallet Address Lookup</h2>
        <p className="text-cyber-muted text-sm mb-5">Enter a Bitcoin or Ethereum address to fetch live on-chain data and run risk analysis.</p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            className="input font-mono flex-1"
            placeholder="0x... or bc1... or 1... or 3..."
            value={address}
            onChange={e => setAddress(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          <select
            className="input sm:w-40"
            value={chain}
            onChange={e => setChain(e.target.value)}
          >
            <option value="">Auto-detect</option>
            <option value="ethereum">Ethereum</option>
            <option value="bitcoin">Bitcoin</option>
          </select>
          <button type="submit" disabled={loading || !address.trim()} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            {loading ? <Spinner size="sm" /> : <Search size={16} />}
            {loading ? 'Analysing…' : 'Search'}
          </button>
        </form>

        {error && <Alert type="error" message={error} className="mt-4" />}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-slide-up">
          {/* Wallet overview */}
          <div className="card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <ChainBadge chain={wallet.chain} />
                  <RiskBadge level={risk.riskLevel} />
                </div>
                <p className="address text-base mt-2">{wallet.address} <CopyButton value={wallet.address} /></p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-white text-2xl font-mono font-semibold">{formatNumber(wallet.balance, 6)}</p>
                <p className="text-cyber-muted text-sm">{formatUsd(wallet.balanceUsd)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-cyber-border">
              {[
                { label: 'Transactions', value: wallet.totalTxCount?.toLocaleString() ?? '—' },
                { label: 'Risk Score',   value: `${risk.riskScore} / 100` },
                { label: 'First Seen',   value: formatDate(wallet.firstTxAt) },
                { label: 'Last Active',  value: formatDate(wallet.lastTxAt) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-cyber-dim text-[10px] font-mono uppercase tracking-widest">{label}</p>
                  <p className="text-white text-sm font-mono mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                <AlertTriangle size={15} className="text-yellow-400" /> Risk Indicators
              </h3>
              {risk.indicators.length === 0 ? (
                <div className="flex items-center gap-2 text-cyber-green text-sm py-2">
                  <CheckCircle size={16} />
                  <span>No risk indicators triggered</span>
                </div>
              ) : (
                <div>
                  {risk.indicators.map((ind, i) => (
                    <IndicatorRow key={i} flag={ind.flag} detail={ind.detail} />
                  ))}
                </div>
              )}
            </div>

            {/* End receiver */}
            <div className="card">
              <h3 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                <Target size={15} className="text-cyber-cyan" /> Probable End Receiver
              </h3>

              <div className="mb-3">
                <p className="text-cyber-dim text-[10px] font-mono uppercase tracking-widest mb-1">Probable Destination</p>
                <p className="address text-sm">{endReceiver.probableEndReceiver} <CopyButton value={endReceiver.probableEndReceiver} /></p>
              </div>

              <div className="flex gap-6 mb-4">
                <div>
                  <p className="text-cyber-dim text-[10px] font-mono uppercase tracking-widest">Confidence</p>
                  <p className="text-white font-mono text-lg">{endReceiver.confidenceScore}%</p>
                </div>
                <div>
                  <p className="text-cyber-dim text-[10px] font-mono uppercase tracking-widest">Hops Traced</p>
                  <p className="text-white font-mono text-lg">{endReceiver.hopCount}</p>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="h-1.5 bg-cyber-border rounded-full mb-4 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${endReceiver.confidenceScore}%`,
                    background: endReceiver.confidenceScore >= 70
                      ? '#00C853' : endReceiver.confidenceScore >= 40
                      ? '#FFD600' : '#EF5350'
                  }}
                />
              </div>

              {/* Hop path toggle */}
              {endReceiver.path?.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowHops(v => !v)}
                    className="flex items-center gap-1.5 text-cyber-cyan text-xs font-mono hover:underline"
                  >
                    {showHops ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showHops ? 'Hide' : 'Show'} hop path ({endReceiver.path.length} hops)
                  </button>
                  {showHops && (
                    <div className="mt-3 border border-cyber-border/50 rounded-lg p-3 bg-cyber-surface/50">
                      {endReceiver.path.map((step, i) => (
                        <HopStep key={i} step={step} index={i + 1} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <p className="text-cyber-dim text-[10px] mt-4 leading-relaxed">{endReceiver.disclaimer}</p>
            </div>
          </div>

          {/* Recent transactions preview */}
          {wallet.transactions?.length > 0 && (
            <div className="card">
              <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
                Recent Transactions
                <span className="text-cyber-dim text-xs font-mono">({Math.min(wallet.transactions.length, 10)} of {wallet.totalTxCount})</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-cyber-border text-cyber-dim font-mono">
                      <th className="text-left pb-2 pr-4">Tx Hash</th>
                      <th className="text-left pb-2 pr-4">From</th>
                      <th className="text-left pb-2 pr-4">To</th>
                      <th className="text-right pb-2 pr-4">Amount</th>
                      <th className="text-right pb-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallet.transactions.slice(0, 10).map((tx, i) => (
                      <tr key={i} className="border-b border-cyber-border/30 hover:bg-cyber-surface/30">
                        <td className="py-2 pr-4"><span className="hash">{truncateAddress(tx.txHash, 6)}</span></td>
                        <td className="py-2 pr-4"><span className="hash">{truncateAddress(tx.fromAddress, 6)}</span></td>
                        <td className="py-2 pr-4"><span className="hash">{truncateAddress(tx.toAddress, 6)}</span></td>
                        <td className="py-2 pr-4 text-right font-mono text-white">{formatNumber(tx.amount, 6)}</td>
                        <td className="py-2 text-right text-cyber-muted">{formatDate(tx.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
