import { AuthenticatedUser } from './authenticated-user'

export interface LoginResponse {
  accessToken: string
  expiresIn: number
  tokenType: 'Bearer'
  user: AuthenticatedUser
}
