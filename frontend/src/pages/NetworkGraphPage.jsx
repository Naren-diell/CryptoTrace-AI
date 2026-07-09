import { useState, useCallback, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from 'dagre'
import { graphApi } from '../services/walletApi'
import { Alert, Spinner, RiskBadge } from '../components/ui'
import { truncateAddress } from '../utils/format'
import { Search, Network, ZoomIn, ZoomOut } from 'lucide-react'

// ── Dagre auto-layout ──────────────────────────────────────────────────────
function getLayoutedElements(nodes, edges) {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', ranksep: 180, nodesep: 80 })
  g.setDefaultEdgeLabel(() => ({}))

  nodes.forEach(n => g.setNode(n.id, { width: 200, height: 60 }))
  edges.forEach(e => g.setEdge(e.source, e.target))
  dagre.layout(g)

  return {
    nodes: nodes.map(n => {
      const { x, y } = g.node(n.id)
      return { ...n, position: { x: x - 100, y: y - 30 } }
    }),
    edges,
  }
}

// ── Custom node ────────────────────────────────────────────────────────────
const riskBorderColor = { low: '#00C853', medium: '#FFD600', high: '#EF5350', unknown: '#4A5568' }

function WalletNode({ data }) {
  const borderColor = riskBorderColor[data.riskLevel] ?? '#4A5568'
  const isOrigin = data.label?.includes('(search origin)')
  return (
    <div
      style={{
        border: `1.5px solid ${borderColor}`,
        background: isOrigin ? '#0D2240' : '#111827',
        borderRadius: 8,
        padding: '8px 12px',
        minWidth: 180,
        boxShadow: isOrigin ? `0 0 16px ${borderColor}40` : 'none',
      }}
    >
      <div style={{ fontSize: 9, color: '#B0BEC5', fontFamily: 'JetBrains Mono, monospace', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {isOrigin ? '● ORIGIN' : '○ WALLET'} · {data.riskLevel?.toUpperCase() ?? 'UNKNOWN'}
      </div>
      <div style={{ fontSize: 11, color: '#00E5FF', fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all' }}>
        {truncateAddress(data.label?.replace(' (search origin)', ''), 8)}
      </div>
      {data.riskScore > 0 && (
        <div style={{ marginTop: 4, height: 3, background: '#1E2A3A', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${data.riskScore}%`, background: borderColor, borderRadius: 2 }} />
        </div>
      )}
    </div>
  )
}

const nodeTypes = { default: WalletNode }

// ── Edge defaults ──────────────────────────────────────────────────────────
const edgeDefaults = {
  style: { stroke: '#1565C0', strokeWidth: 1.5 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#1565C0', width: 16, height: 16 },
  labelStyle: { fill: '#B0BEC5', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' },
  labelBgStyle: { fill: '#111827', fillOpacity: 0.85 },
}

export default function NetworkGraphPage() {
  const [address, setAddress]     = useState('')
  const [depth, setDepth]         = useState(2)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [stats, setStats]         = useState(null)

  const handleSearch = useCallback(async (e) => {
    e.preventDefault()
    if (!address.trim()) return
    setError(''); setLoading(true); setStats(null)
    try {
      const res = await graphApi.getGraph(address.trim(), depth)
      const rawNodes = res.data.data.nodes
      const rawEdges = res.data.data.edges

      const flowNodes = rawNodes.map(n => ({
        id: n.id,
        type: 'default',
        data: n.data,
        position: n.position,
      }))

      const flowEdges = rawEdges.map(e => ({
        ...e,
        ...edgeDefaults,
        label: e.label ? String(parseFloat(e.label).toFixed(4)) : '',
        animated: true,
      }))

      const { nodes: ln, edges: le } = getLayoutedElements(flowNodes, flowEdges)
      setNodes(ln)
      setEdges(le)
      setStats({ nodeCount: ln.length, edgeCount: le.length })
    } catch (err) {
      setError(err.response?.data?.message ?? 'Graph fetch failed. Make sure the wallet has been searched first.')
    } finally {
      setLoading(false)
    }
  }, [address, depth])

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="card">
        <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
          <Network size={18} className="text-cyber-cyan" /> Transaction Network Graph
        </h2>
        <p className="text-cyber-muted text-sm mb-4">
          Visualise fund flow as an interactive node graph. Wallet must be searched first.
        </p>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <input
            type="text"
            className="input font-mono flex-1 min-w-48"
            placeholder="Enter wallet address…"
            value={address}
            onChange={e => setAddress(e.target.value)}
            spellCheck={false}
          />
          <div className="flex items-center gap-2">
            <label className="text-cyber-muted text-xs font-mono whitespace-nowrap">Depth</label>
            <select className="input w-20" value={depth} onChange={e => setDepth(Number(e.target.value))}>
              {[1,2,3,4,5].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading || !address.trim()} className="btn-primary flex items-center gap-2">
            {loading ? <Spinner size="sm" /> : <Search size={15} />}
            {loading ? 'Loading…' : 'Build Graph'}
          </button>
        </form>
        {error && <Alert type="error" message={error} className="mt-3" />}
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="flex gap-6 px-1 text-xs font-mono text-cyber-muted">
          <span><span className="text-cyber-cyan">{stats.nodeCount}</span> wallets</span>
          <span><span className="text-cyber-cyan">{stats.edgeCount}</span> transactions</span>
          <span className="text-cyber-dim">Scroll to zoom · Drag to pan · Click node to inspect</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 px-1 flex-wrap">
        {[['low','#00C853'],['medium','#FFD600'],['high','#EF5350'],['unknown','#4A5568']].map(([label,color])=>(
          <div key={label} className="flex items-center gap-1.5 text-xs text-cyber-muted">
            <div className="w-3 h-3 rounded-sm border" style={{ borderColor: color, background: `${color}20` }} />
            {label} risk
          </div>
        ))}
      </div>

      {/* Graph canvas */}
      <div className="rounded-lg overflow-hidden border border-cyber-border" style={{ height: 560 }}>
        {nodes.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-full bg-cyber-surface text-cyber-dim text-sm font-mono flex-col gap-3">
            <Network size={36} className="text-cyber-border" />
            <p>Enter a wallet address and click Build Graph</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            style={{ background: '#0A0E1A' }}
          >
            <Background color="#1E2A3A" gap={24} size={1} />
            <Controls
              style={{ background: '#111827', border: '1px solid #1E2A3A', borderRadius: 8 }}
              showInteractive={false}
            />
            <MiniMap
              nodeColor={n => riskBorderColor[n.data?.riskLevel] ?? '#4A5568'}
              maskColor="rgba(10,14,26,0.75)"
              style={{ background: '#0D1117', border: '1px solid #1E2A3A' }}
            />
            {loading && (
              <Panel position="top-center">
                <div className="flex items-center gap-2 bg-cyber-card border border-cyber-border rounded-lg px-4 py-2 text-sm text-white">
                  <Spinner size="sm" /> Building graph…
                </div>
              </Panel>
            )}
          </ReactFlow>
        )}
      </div>
    </div>
  )
}
