import axios from 'axios'
import { useAuthStore } from '@/stores/auth-store'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().auth.accessToken
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      if (status === 401 || status === 403) {
        const { reset } = useAuthStore.getState().auth
        reset()
        if (typeof window !== 'undefined') {
          const redirect = `${window.location.pathname}${window.location.search}`
          if (!window.location.pathname.startsWith('/sign-in')) {
            window.location.href = `/sign-in?redirect=${encodeURIComponent(redirect)}`
          }
        }
      }
    }
    return Promise.reject(error)
  }
)
