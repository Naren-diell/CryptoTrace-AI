import { useState, useRef, useEffect } from 'react'
import { assistantApi } from '../services/walletApi'
import { Alert, Spinner } from '../components/ui'
import { truncateAddress } from '../utils/format'
import { MessageSquare, Send, Bot, User, Cpu, RotateCcw } from 'lucide-react'
import clsx from 'clsx'

const EXAMPLE_QUESTIONS = [
  'Who is the probable end receiver?',
  'Show suspicious transactions.',
  'What is the risk level and why?',
  'Summarize fund movement.',
  'Find high-risk wallet indicators.',
]

function Message({ msg }) {
  const isBot = msg.role === 'assistant'
  return (
    <div className={clsx('flex gap-3', isBot ? 'items-start' : 'items-start flex-row-reverse')}>
      <div className={clsx(
        'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center',
        isBot ? 'bg-cyber-blue/20 border border-cyber-blue/30' : 'bg-cyber-border'
      )}>
        {isBot ? <Cpu size={14} className="text-cyber-cyan" /> : <User size={14} className="text-cyber-muted" />}
      </div>
      <div className={clsx(
        'max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed',
        isBot
          ? 'bg-cyber-surface border border-cyber-border text-white'
          : 'bg-cyber-blue/20 border border-cyber-blue/30 text-white'
      )}>
        {msg.content}
        {msg.loading && (
          <span className="inline-flex items-center gap-1 ml-2">
            <span className="w-1 h-1 bg-cyber-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-cyber-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 bg-cyber-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}
      </div>
    </div>
  )
}

export default function AssistantPage() {
  const [address, setAddress]     = useState('')
  const [lockedAddress, setLockedAddress] = useState('')
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function lockAddress(e) {
    e.preventDefault()
    if (!address.trim()) return
    setLockedAddress(address.trim())
    setMessages([{
      role: 'assistant',
      content: `Workspace loaded for address ${truncateAddress(address.trim(), 10)}. Ask me anything about this wallet's risk profile, transaction patterns, or probable fund destination.`
    }])
    setError('')
  }

  async function sendMessage(question) {
    const q = (question ?? input).trim()
    if (!q || !lockedAddress || loading) return
    setInput('')
    setError('')

    const userMsg = { role: 'user', content: q }
    const botPlaceholder = { role: 'assistant', content: '', loading: true }
    setMessages(m => [...m, userMsg, botPlaceholder])
    setLoading(true)

    try {
      const res = await assistantApi.chat(lockedAddress, q)
      setMessages(m => [
        ...m.slice(0, -1),
        { role: 'assistant', content: res.data.data.answer }
      ])
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Assistant error. Try again.'
      setMessages(m => [...m.slice(0, -1), { role: 'assistant', content: `⚠️ ${msg}` }])
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setLockedAddress('')
    setAddress('')
    setMessages([])
    setError('')
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
          <MessageSquare size={18} className="text-cyber-cyan" /> AI Investigation Assistant
        </h2>
        <p className="text-cyber-muted text-sm">
          Ask natural-language questions about any analysed wallet. Powered by OpenAI (falls back to rule-based answers if no API key is set).
        </p>
      </div>

      {/* Address lock */}
      {!lockedAddress ? (
        <div className="card">
          <p className="text-cyber-muted text-sm mb-3">Enter a wallet address to start a session (must be analysed first via Wallet Search):</p>
          <form onSubmit={lockAddress} className="flex gap-3">
            <input
              type="text"
              className="input font-mono flex-1"
              placeholder="Wallet address…"
              value={address}
              onChange={e => setAddress(e.target.value)}
              spellCheck={false}
            />
            <button type="submit" disabled={!address.trim()} className="btn-primary flex items-center gap-2">
              <Bot size={15} /> Start Session
            </button>
          </form>
          {error && <Alert type="error" message={error} className="mt-3" />}
        </div>
      ) : (
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center gap-2 text-xs font-mono text-cyber-green">
            <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse-slow" />
            Session: {truncateAddress(lockedAddress, 12)}
          </div>
          <button onClick={reset} className="btn-ghost flex items-center gap-1.5 text-xs">
            <RotateCcw size={12} /> New session
          </button>
        </div>
      )}

      {/* Chat area */}
      {lockedAddress && (
        <div className="card flex flex-col" style={{ height: 460 }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            <div ref={bottomRef} />
          </div>

          {/* Example questions */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {EXAMPLE_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="text-xs font-mono px-2.5 py-1.5 rounded border border-cyber-border text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/40 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 border-t border-cyber-border pt-4">
            <input
              type="text"
              className="input flex-1 text-sm"
              placeholder="Ask about risk, fund flow, suspicious activity…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="btn-primary px-4 flex items-center gap-2"
            >
              {loading ? <Spinner size="sm" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
