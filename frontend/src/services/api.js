import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  timeout: 30000,
})

// Attach stored token on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ct_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Global error handling - redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ct_token')
      localStorage.removeItem('ct_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api