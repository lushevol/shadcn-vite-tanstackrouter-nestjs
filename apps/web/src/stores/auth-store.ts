import { create } from 'zustand'
import { getCookie, removeCookie, setCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'thisisjustarandomstring'

type Role = string

export interface AuthUser {
  id: number
  email: string
  fullName: string
  accountNumber: string
  roles: Role[]
}

interface AuthState {
  auth: {
    user: AuthUser | null
    accessToken: string | null
    expiresAt: number | null
    setSession: (session: { accessToken: string; user: AuthUser }) => void
    isAuthenticated: () => boolean
    hasRole: (required: Role | Role[]) => boolean
    reset: () => void
  }
}

type DecodedToken = Partial<AuthUser> & { sub?: number; exp?: number }

function decodeToken(token: string): DecodedToken | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(atob(normalized))
    return decoded as DecodedToken
  } catch (error) {
    console.error('Failed to decode JWT payload', error)
    return null
  }
}

function parseCookieToken(): string | null {
  const cookieState = getCookie(ACCESS_TOKEN)
  if (!cookieState) return null

  try {
    const parsed = JSON.parse(cookieState)
    if (typeof parsed === 'string') return parsed
    if (parsed && typeof parsed === 'object' && 'token' in parsed) {
      const tokenValue = (parsed as { token?: unknown }).token
      return typeof tokenValue === 'string' ? tokenValue : null
    }
  } catch (error) {
    // Ignore JSON parse errors – assume the raw cookie is the token string
    return cookieState
  }

  return cookieState
}

function buildUserFromToken(token: string | null): {
  user: AuthUser | null
  expiresAt: number | null
} {
  if (!token) return { user: null, expiresAt: null }
  const decoded = decodeToken(token)
  if (!decoded) return { user: null, expiresAt: null }

  const expiresAt = decoded.exp ? decoded.exp * 1000 : null
  const roles = Array.isArray(decoded.roles) ? decoded.roles : []

  if (!decoded.email || !decoded.accountNumber || !decoded.fullName) {
    return { user: null, expiresAt }
  }

  return {
    user: {
      id: typeof decoded.sub === 'number' ? decoded.sub : -1,
      email: decoded.email,
      accountNumber: decoded.accountNumber,
      fullName: decoded.fullName,
      roles,
    },
    expiresAt,
  }
}

const initialToken = parseCookieToken()
const initialSession = buildUserFromToken(initialToken)

export const useAuthStore = create<AuthState>()((set, get) => ({
  auth: {
    user: initialSession.user,
    accessToken: initialToken,
    expiresAt: initialSession.expiresAt,
    setSession: ({ accessToken, user }) => {
      const decoded = decodeToken(accessToken)
      const expiresAt = decoded?.exp ? decoded.exp * 1000 : null
      setCookie(ACCESS_TOKEN, accessToken)

      set((state) => ({
        auth: {
          ...state.auth,
          user,
          accessToken,
          expiresAt,
        },
      }))
    },
    isAuthenticated: () => {
      const state = get().auth
      if (!state.accessToken || !state.user) {
        return false
      }

      if (state.expiresAt && state.expiresAt <= Date.now()) {
        get().auth.reset()
        return false
      }

      return true
    },
    hasRole: (required) => {
      const roles = Array.isArray(required) ? required : [required]
      const state = get().auth
      if (!state.user) return false

      return roles.some((role) => state.user?.roles.includes(role))
    },
    reset: () => {
      removeCookie(ACCESS_TOKEN)
      set((state) => ({
        auth: {
          ...state.auth,
          user: null,
          accessToken: null,
          expiresAt: null,
        },
      }))
    },
  },
}))
