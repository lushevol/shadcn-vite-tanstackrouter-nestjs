import { AuthenticatedUser } from './authenticated-user'

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  refreshExpiresIn: number
  tokenType: 'Bearer'
  user: AuthenticatedUser
}
