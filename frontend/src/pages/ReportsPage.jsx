import { useState, useEffect } from 'react'
import { reportApi, investigationApi } from '../services/walletApi'
import { Alert, Spinner, EmptyState } from '../components/ui'
import { FileText, Download, FileSpreadsheet, Loader } from 'lucide-react'

const REPORT_TYPES = [
  { value: 'investigation_summary', label: 'Investigation Summary' },
  { value: 'transaction_flow',      label: 'Transaction Flow Analysis' },
  { value: 'wallet_risk',           label: 'Wallet Risk Assessment' },
  { value: 'end_receiver',          label: 'End Receiver Analysis' },
  { value: 'timeline',              label: 'Timeline Report' },
]

export default function ReportsPage() {
  const [investigations, setInvestigations] = useState([])
  const [form, setForm]     = useState({ investigationId: '', reportType: 'investigation_summary', format: 'pdf' })
  const [loading, setLoading] = useState(false)
  const [loadingInv, setLoadingInv] = useState(true)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [fileName, setFileName] = useState('')

  useEffect(() => {
    investigationApi.list()
      .then(r => setInvestigations(r.data.data))
      .catch(() => setError('Could not load investigations.'))
      .finally(() => setLoadingInv(false))
  }, [])

  async function generate(e) {
    e.preventDefault()
    if (!form.investigationId) { setError('Select an investigation.'); return }
    setError(''); setSuccess(''); setDownloadUrl(null); setLoading(true)
    try {
      const res = await reportApi.generate({
        investigationId: Number(form.investigationId),
        reportType: form.reportType,
        format: form.format,
      })
      const { downloadUrl: url, fileName: fn } = res.data.data
      setDownloadUrl(url)
      setFileName(fn)
      setSuccess(`Report generated: ${fn}`)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Report generation failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload() {
    if (!fileName) return
    try {
      const res = await reportApi.download(fileName)
      const blob = new Blob([res.data])
      const url  = window.URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = fileName; a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Download failed. Try again.')
    }
  }

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-white font-semibold flex items-center gap-2">
          <FileText size={18} className="text-cyber-cyan" /> Report Generator
        </h2>
        <p className="text-cyber-muted text-sm mt-0.5">Export investigation data as PDF or Excel</p>
      </div>

      <div className="card space-y-4">
        {error   && <Alert type="error"   message={error} />}
        {success && <Alert type="success" message={success} />}

        <div>
          <label className="block text-cyber-muted text-xs font-mono uppercase tracking-wider mb-1.5">Investigation *</label>
          {loadingInv ? (
            <div className="flex items-center gap-2 text-cyber-muted text-sm"><Spinner size="sm" /> Loading…</div>
          ) : (
            <select className="input" value={form.investigationId} onChange={set('investigationId')}>
              <option value="">— Select investigation —</option>
              {investigations.map(inv => (
                <option key={inv.id} value={inv.id}>{inv.title}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-cyber-muted text-xs font-mono uppercase tracking-wider mb-1.5">Report Type</label>
          <select className="input" value={form.reportType} onChange={set('reportType')}>
            {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-cyber-muted text-xs font-mono uppercase tracking-wider mb-2">Format</label>
          <div className="flex gap-3">
            {[
              { value: 'pdf',  label: 'PDF',   icon: FileText },
              { value: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm(f => ({ ...f, format: value }))}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-all ${
                  form.format === value
                    ? 'bg-cyber-blue/20 border-cyber-blue/50 text-white'
                    : 'border-cyber-border text-cyber-muted hover:text-white hover:border-cyber-border'
                }`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={generate}
            disabled={loading || loadingInv}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? <Spinner size="sm" /> : <FileText size={15} />}
            {loading ? 'Generating…' : 'Generate Report'}
          </button>

          {downloadUrl && (
            <button onClick={handleDownload} className="btn-primary flex items-center gap-2 bg-cyber-green/20 border border-cyber-green/40 text-cyber-green hover:bg-cyber-green/30">
              <Download size={15} /> Download {form.format.toUpperCase()}
            </button>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="card border-cyber-border/50 bg-cyber-surface/40">
        <p className="text-cyber-muted text-xs font-mono uppercase tracking-widest mb-3">What's included</p>
        <ul className="space-y-2 text-sm text-cyber-muted">
          {[
            'Investigation metadata and case summary',
            'All wallets linked to the investigation',
            'Risk scores and triggered indicators per wallet',
            'Probable end-receiver address and confidence scores',
            'Full transaction timeline (up to 200 transactions)',
            'Disclaimer on heuristic limitations',
          ].map(item => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-cyber-cyan mt-0.5">▸</span>{item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
