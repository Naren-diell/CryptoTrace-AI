import api from './api'

export const walletApi = {
  search: (address, chain = null, investigationId = null) =>
    api.post('/wallets/search', { address, chain, investigationId }),

  getHistory: (address) =>
    api.get(`/wallets/${address}/history`),

  list: (params = {}) =>
    api.get('/wallets', { params }),
}

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () =>     api.get('/admin/users'),
  updateUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  updateUserRole:   (id, role)     => api.patch(`/admin/users/${id}/role`,   { role }),
}

export const investigationApi = {
  create: (body) =>       api.post('/investigations', body),
  list:   ()     =>       api.get('/investigations'),
  get:    (id)   =>       api.get(`/investigations/${id}`),
  updateStatus: (id, status) => api.patch(`/investigations/${id}/status`, { status }),
}

export const graphApi = {
  getGraph: (address, depth = 2) =>
    api.get(`/graph/${address}`, { params: { depth } }),
}

export const assistantApi = {
  chat: (address, question) =>
    api.post('/assistant/chat', { address, question }),
}

export const reportApi = {
  generate: (body) => api.post('/reports/generate', body),
  download: (fileName) =>
    api.get(`/reports/download/${fileName}`, { responseType: 'blob' }),
}

export { default as api } from './api'
