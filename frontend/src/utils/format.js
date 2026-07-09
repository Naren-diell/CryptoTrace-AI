export function truncateAddress(addr, chars = 8) {
  if (!addr) return '—'
  if (addr.length <= chars * 2 + 3) return addr
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`
}

export function formatNumber(n, decimals = 4) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

export function formatUsd(n) {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(Number(n))
}

export function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function riskClass(level) {
  const map = {
    low:    'risk-low',
    medium: 'risk-medium',
    high:   'risk-high',
  }
  return map[level?.toLowerCase()] ?? 'risk-medium'
}

export function riskColor(level) {
  const map = { low: '#00C853', medium: '#FFD600', high: '#EF5350' }
  return map[level?.toLowerCase()] ?? '#B0BEC5'
}

export function chainColor(chain) {
  return chain === 'bitcoin' ? '#F7931A' : '#627EEA'
}

export function chainLabel(chain) {
  return chain === 'bitcoin' ? 'BTC' : 'ETH'
}
