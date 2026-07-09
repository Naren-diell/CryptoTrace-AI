import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from "../context/AuthContext";
import { Alert, Spinner } from "../components/ui";
import { Cpu, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cyber-base flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,229,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-cyber-surface border border-cyber-border shadow-glow mb-4">
            <Cpu className="text-cyber-cyan" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white">CryptoTrace AI</h1>
          <p className="text-cyber-muted text-sm mt-1 font-mono">Blockchain Investigation Platform</p>
        </div>

        <div className="card shadow-glow-md">
          <h2 className="text-white font-semibold mb-1">Sign in</h2>
          <p className="text-cyber-muted text-sm mb-6">Access your investigation workspace</p>

          {error && <Alert type="error" message={error} className="mb-4" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-cyber-muted text-xs font-mono uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                className="input"
                placeholder="investigator@agency.gov"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-cyber-muted text-xs font-mono uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-dim hover:text-cyber-muted transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <Spinner size="sm" /> : null}
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-cyber-muted text-sm mt-5">
            No account?{' '}
            <Link to="/register" className="text-cyber-cyan hover:underline">Register here</Link>
          </p>
        </div>

        <p className="text-center text-cyber-dim text-xs font-mono mt-6">
          CRYPTOTRACE AI © {new Date().getFullYear()} — FOR AUTHORIZED USE ONLY
        </p>
      </div>
    </div>
  )
}
