import type { AuthUser } from '@/stores/auth-store'
import { apiClient } from '@/lib/api-client'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  expiresIn: number
  tokenType: 'Bearer'
  user: AuthUser
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', request)
  return data
}
