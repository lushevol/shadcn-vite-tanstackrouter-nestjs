import { create } from 'zustand'
import { getCookie, removeCookie, setCookie } from '@/lib/cookies'

const ACCESS_TOKEN_COOKIE = 'thisisjustarandomstring'
const REFRESH_TOKEN_COOKIE = 'thisisjustarandomrefreshtoken'

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
    refreshToken: string | null
    refreshExpiresAt: number | null
    setSession: (session: {
      accessToken: string
      refreshToken: string
      refreshExpiresIn: number
      user: AuthUser
    }) => void
    isAuthenticated: () => boolean
    hasRole: (required: Role | Role[]) => boolean
    getRefreshToken: () => string | null
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
  } catch (_error) {
    // console.error('Failed to decode JWT payload', error)
    return null
  }
}

function parseCookieToken(cookieName: string): {
  token: string | null
  storedExpiresAt: number | null
} {
  const cookieState = getCookie(cookieName)
  if (!cookieState) return { token: null, storedExpiresAt: null }

  try {
    const parsed = JSON.parse(cookieState)
    if (typeof parsed === 'string') {
      return { token: parsed, storedExpiresAt: null }
    }
    if (parsed && typeof parsed === 'object' && 'token' in parsed) {
      const tokenValue = (parsed as { token?: unknown }).token
      const expiresAt =
        parsed && typeof parsed === 'object' && 'expiresAt' in parsed
          ? Number((parsed as { expiresAt?: unknown }).expiresAt)
          : null
      return {
        token: typeof tokenValue === 'string' ? tokenValue : null,
        storedExpiresAt: Number.isFinite(expiresAt) ? (expiresAt as number) : null,
      }
    }
  } catch (_error) {
    // Ignore JSON parse errors – assume the raw cookie is the token string
    return { token: cookieState, storedExpiresAt: null }
  }

  return { token: cookieState, storedExpiresAt: null }
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

const initialAccess = parseCookieToken(ACCESS_TOKEN_COOKIE)
const initialSession = buildUserFromToken(initialAccess.token)
const initialRefresh = parseCookieToken(REFRESH_TOKEN_COOKIE)

export const useAuthStore = create<AuthState>()((set, get) => ({
  auth: {
    user: initialSession.user,
    accessToken: initialAccess.token,
    expiresAt: initialSession.expiresAt,
    refreshToken: initialRefresh.token,
    refreshExpiresAt: initialRefresh.storedExpiresAt,
    setSession: ({ accessToken, refreshToken, refreshExpiresIn, user }) => {
      const decoded = decodeToken(accessToken)
      const expiresAt = decoded?.exp ? decoded.exp * 1000 : null
      const refreshExpiresAt = Date.now() + refreshExpiresIn * 1000

      const accessCookiePayload = expiresAt
        ? JSON.stringify({ token: accessToken, expiresAt })
        : accessToken

      const refreshCookiePayload = JSON.stringify({
        token: refreshToken,
        expiresAt: refreshExpiresAt,
      })

      const accessMaxAge = expiresAt
        ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
        : undefined

      setCookie(ACCESS_TOKEN_COOKIE, accessCookiePayload, accessMaxAge)
      setCookie(REFRESH_TOKEN_COOKIE, refreshCookiePayload, refreshExpiresIn)

      set((state) => ({
        auth: {
          ...state.auth,
          user,
          accessToken,
          expiresAt,
          refreshToken,
          refreshExpiresAt,
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
    getRefreshToken: () => {
      const state = get().auth
      return state.refreshToken
    },
    reset: () => {
      removeCookie(ACCESS_TOKEN_COOKIE)
      removeCookie(REFRESH_TOKEN_COOKIE)
      set((state) => ({
        auth: {
          ...state.auth,
          user: null,
          accessToken: null,
          expiresAt: null,
          refreshToken: null,
          refreshExpiresAt: null,
        },
      }))
    },
  },
}))
