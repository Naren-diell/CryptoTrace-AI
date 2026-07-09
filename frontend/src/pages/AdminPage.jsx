import { useState, useEffect } from 'react'
import { adminApi } from '../services/walletApi'
import { Alert, Spinner, StatCard, EmptyState } from '../components/ui'
import { formatDate, formatUsd } from '../utils/format'
import { Shield, Users, Database, TrendingUp, AlertTriangle, Check, X } from 'lucide-react'
import clsx from 'clsx'

function UserRow({ user, onUpdate }) {
  const [loading, setLoading] = useState(false)

  async function toggleStatus() {
    setLoading(true)
    await onUpdate('status', user.id, !user.is_active)
    setLoading(false)
  }

  async function toggleRole() {
    const newRole = user.role === 'admin' ? 'investigator' : 'admin'
    setLoading(true)
    await onUpdate('role', user.id, newRole)
    setLoading(false)
  }

  return (
    <tr className="border-b border-cyber-border/40 hover:bg-cyber-surface/30 transition-colors">
      <td className="py-3 pr-4">
        <div>
          <p className="text-white text-sm font-medium">{user.name}</p>
          <p className="text-cyber-muted text-xs font-mono">{user.email}</p>
        </div>
      </td>
      <td className="py-3 pr-4">
        <span className={clsx(
          'px-2 py-0.5 rounded text-xs font-mono uppercase border',
          user.role === 'admin'
            ? 'text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan/30'
            : 'text-blue-400 bg-blue-400/10 border-blue-400/30'
        )}>
          {user.role}
        </span>
      </td>
      <td className="py-3 pr-4">
        <span className={clsx(
          'flex items-center gap-1.5 text-xs font-mono',
          user.is_active ? 'text-cyber-green' : 'text-cyber-red'
        )}>
          {user.is_active ? <Check size={12} /> : <X size={12} />}
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="py-3 pr-4">
        <p className="text-cyber-muted text-xs font-mono">{formatDate(user.created_at)}</p>
      </td>
      <td className="py-3 text-right">
        {loading ? <Spinner size="sm" /> : (
          <div className="flex justify-end gap-2">
            <button onClick={toggleRole}   className="text-xs btn-ghost py-1 px-2">
              → {user.role === 'admin' ? 'Investigator' : 'Admin'}
            </button>
            <button onClick={toggleStatus} className={clsx('text-xs px-2 py-1 rounded border transition-all', user.is_active
              ? 'text-cyber-red border-cyber-red/30 hover:bg-cyber-red/10'
              : 'text-cyber-green border-cyber-green/30 hover:bg-cyber-green/10'
            )}>
              {user.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

export default function AdminPage() {
  const [users, setUsers]       = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  async function load() {
    setLoading(true)
    try {
      const [usersRes, statsRes] = await Promise.all([adminApi.getUsers(), adminApi.getDashboard()])
      setUsers(usersRes.data.data)
      setStats(statsRes.data.data)
    } catch {
      setError('Failed to load admin data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleUpdate(type, id, value) {
    try {
      if (type === 'status') await adminApi.updateUserStatus(id, value)
      if (type === 'role')   await adminApi.updateUserRole(id, value)
      setUsers(u => u.map(usr => {
        if (usr.id !== id) return usr
        return type === 'status' ? { ...usr, is_active: value } : { ...usr, role: value }
      }))
    } catch {
      setError('Update failed.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield size={20} className="text-cyber-cyan" />
        <div>
          <h2 className="text-white font-semibold">Admin Panel</h2>
          <p className="text-cyber-muted text-sm">User management and platform statistics</p>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Stats row */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Transactions" value={Number(stats.totalTransactions).toLocaleString()} icon={Database} accent="#00E5FF" />
              <StatCard label="Wallets Analysed"   value={Number(stats.totalWallets).toLocaleString()}      icon={Users}    accent="#1565C0" />
              <StatCard label="High Risk Wallets"  value={Number(stats.highRiskWallets).toLocaleString()}   icon={AlertTriangle} accent="#EF5350" />
              <StatCard label="Total Volume"       value={formatUsd(stats.totalVolumeUsd)}                  icon={TrendingUp}    accent="#00C853" />
            </div>
          )}

          {/* Users table */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Users size={16} className="text-cyber-cyan" />
                Users <span className="text-cyber-dim font-mono text-sm">({users.length})</span>
              </h3>
            </div>
            {users.length === 0 ? (
              <EmptyState icon={Users} title="No users found" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cyber-border text-cyber-dim text-xs font-mono uppercase tracking-wider">
                      <th className="text-left pb-3 pr-4">User</th>
                      <th className="text-left pb-3 pr-4">Role</th>
                      <th className="text-left pb-3 pr-4">Status</th>
                      <th className="text-left pb-3 pr-4">Joined</th>
                      <th className="text-right pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => <UserRow key={u.id} user={u} onUpdate={handleUpdate} />)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
