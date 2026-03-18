import { get, post } from '@/lib/http'
import type { AuthData, User } from '@/types/api'

export interface LoginPayload {
  username: string
  password: string
  rememberMe?: boolean
}

export interface OAuthAuthorizeResponse {
  authorizationUrl: string
}

export interface OAuthCallbackPayload {
  provider: string
  code: string
  state: string
  redirectUri: string
}

export const authApi = {
  login: (payload: LoginPayload) => post<AuthData>('/api/v1/auth/login', payload),
  logout: () => post('/api/v1/auth/logout'),
  getProfile: () => get<User>('/api/v1/users/profile'),
  getOAuthAuthorizeUrl: (provider: string, redirectUri: string) =>
    get<OAuthAuthorizeResponse>('/api/v1/auth/oauth2/authorize', { params: { provider, redirectUri } }),
  oauthCallback: (payload: OAuthCallbackPayload) =>
    post<AuthData>('/api/v1/auth/oauth2/callback', payload),
}
