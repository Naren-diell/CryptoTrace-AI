import { Construction } from 'lucide-react'

export default function Phase2Placeholder({ name = 'This feature' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="p-5 rounded-2xl bg-cyber-surface border border-cyber-border shadow-glow mb-5">
        <Construction size={40} className="text-cyber-cyan" />
      </div>
      <h2 className="text-white text-xl font-semibold mb-2">{name}</h2>
      <p className="text-cyber-muted text-sm max-w-sm">
        This module is part of Phase 2 and will be available in the next build.
        Phase 1 covers Auth, Dashboard, Wallet Search and Transaction History.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 text-xs font-mono text-cyber-dim">
        {['Network Graph', 'AI Assistant', 'Investigations', 'Reports', 'Admin Panel'].map(f => (
          <div key={f} className="px-3 py-2 border border-cyber-border/50 rounded text-left flex items-center gap-2">
            <span className="text-cyber-blue">▸</span>{f}
          </div>
        ))}
      </div>
    </div>
  )
}
