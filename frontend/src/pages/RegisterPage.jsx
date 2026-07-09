import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from "../context/AuthContext";
import { Alert, Spinner } from "../components/ui";
import { Cpu, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 8)       { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div className="min-h-screen bg-cyber-base flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,229,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-cyber-surface border border-cyber-border shadow-glow mb-4">
            <Cpu className="text-cyber-cyan" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white">CryptoTrace AI</h1>
          <p className="text-cyber-muted text-sm mt-1 font-mono">Create Investigator Account</p>
        </div>

        <div className="card shadow-glow-md">
          <h2 className="text-white font-semibold mb-1">Register</h2>
          <p className="text-cyber-muted text-sm mb-6">New accounts are created as Investigator role</p>

          {error && <Alert type="error" message={error} className="mb-4" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-cyber-muted text-xs font-mono uppercase tracking-wider mb-1.5">Full Name</label>
              <input type="text" className="input" placeholder="Jane Doe" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="block text-cyber-muted text-xs font-mono uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" className="input" placeholder="you@agency.gov" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="block text-cyber-muted text-xs font-mono uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} className="input pr-10"
                  placeholder="Min 8 characters" value={form.password} onChange={set('password')} required
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-dim hover:text-cyber-muted">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-cyber-muted text-xs font-mono uppercase tracking-wider mb-1.5">Confirm Password</label>
              <input type="password" className="input" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} required />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <Spinner size="sm" /> : null}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-cyber-muted text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-cyber-cyan hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
