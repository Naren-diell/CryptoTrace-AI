import { useState, useEffect } from 'react'
import { investigationApi } from '../services/walletApi'
import { Alert, Spinner, EmptyState } from '../components/ui'
import { formatDate } from '../utils/format'
import { FileText, Plus, X, ChevronRight, Folder } from 'lucide-react'
import clsx from 'clsx'

const CASE_TYPES = ['fraud','money_laundering','cybercrime','ransomware','scam','dark_web','other']
const STATUS_COLORS = {
  open:        'text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan/30',
  in_progress: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  closed:      'text-cyber-dim bg-cyber-dim/10 border-cyber-dim/30',
}

function NewInvestigationModal({ onClose, onCreated }) {
  const [form, setForm]     = useState({ title: '', description: '', caseType: 'other' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await investigationApi.create({ title: form.title, description: form.description, caseType: form.caseType })
      onCreated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to create investigation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-lg animate-slide-up shadow-glow-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">New Investigation</h3>
          <button onClick={onClose} className="text-cyber-muted hover:text-white transition-colors"><X size={18} /></button>
        </div>
        {error && <Alert type="error" message={error} className="mb-4" />}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-cyber-muted text-xs font-mono uppercase tracking-wider mb-1.5">Title *</label>
            <input className="input" placeholder="e.g. Ransomware Payment Trace #42" required
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-cyber-muted text-xs font-mono uppercase tracking-wider mb-1.5">Case Type</label>
            <select className="input" value={form.caseType} onChange={e => setForm(f => ({ ...f, caseType: e.target.value }))}>
              {CASE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-cyber-muted text-xs font-mono uppercase tracking-wider mb-1.5">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="Brief description of the case…"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Spinner size="sm" /> : null}
              {loading ? 'Creating…' : 'Create Investigation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')
  const [showModal, setShowModal]           = useState(false)
  const [updatingId, setUpdatingId]         = useState(null)

  async function load() {
    setLoading(true)
    try {
      const res = await investigationApi.list()
      setInvestigations(res.data.data)
    } catch {
      setError('Failed to load investigations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id, status) {
    setUpdatingId(id)
    try {
      await investigationApi.updateStatus(id, status)
      setInvestigations(inv => inv.map(i => i.id === id ? { ...i, status } : i))
    } catch {
      setError('Failed to update status.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-5">
      {showModal && <NewInvestigationModal onClose={() => setShowModal(false)} onCreated={load} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold flex items-center gap-2">
            <FileText size={18} className="text-cyber-cyan" /> Investigations
          </h2>
          <p className="text-cyber-muted text-sm mt-0.5">Manage and track active cases</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> New Investigation
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : investigations.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No investigations yet"
          description="Create a new investigation case to start tracking wallet activity."
          action={<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={15} />New Investigation</button>}
        />
      ) : (
        <div className="space-y-3">
          {investigations.map(inv => (
            <div key={inv.id} className="card hover:border-cyber-blue/40 transition-all">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={clsx('px-2 py-0.5 rounded border text-[10px] font-mono uppercase', STATUS_COLORS[inv.status])}>
                      {inv.status.replace('_',' ')}
                    </span>
                    <span className="text-cyber-dim text-xs font-mono">{inv.case_type?.replace('_',' ')}</span>
                  </div>
                  <h3 className="text-white font-medium">{inv.title}</h3>
                  {inv.description && <p className="text-cyber-muted text-sm mt-1 line-clamp-2">{inv.description}</p>}
                  <p className="text-cyber-dim text-xs mt-2 font-mono">
                    Created {formatDate(inv.created_at)}
                    {inv.created_by_name && ` · by ${inv.created_by_name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    className="input w-36 text-xs py-1.5"
                    value={inv.status}
                    onChange={e => updateStatus(inv.id, e.target.value)}
                    disabled={updatingId === inv.id}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                  {updatingId === inv.id && <Spinner size="sm" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
