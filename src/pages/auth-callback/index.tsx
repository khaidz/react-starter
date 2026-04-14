import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { Center, Loader, Stack, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'

const OAUTH_CALLBACK_URI = `${window.location.origin}/auth/callback`

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  microsoft: 'Azure AD',
}

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const handled = useRef(false)
  const providerRef = useRef(sessionStorage.getItem('oauth_provider') ?? 'microsoft')

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const error = params.get('error')
    const provider = providerRef.current
    sessionStorage.removeItem('oauth_provider')

    if (error) {
      notifications.show({ title: 'Login cancelled', message: params.get('error_description') ?? error, color: 'orange' })
      navigate('/login', { replace: true })
      return
    }

    if (!code) {
      notifications.show({ title: 'Login failed', message: 'Missing authorization code', color: 'red' })
      navigate('/login', { replace: true })
      return
    }

    authApi.oauthCallback({
      provider,
      code,
      state: state ?? '',
      redirectUri: OAUTH_CALLBACK_URI,
    })
      .then((data) => {
        setAuth(data.accessToken, data.refreshToken, data.user)
        notifications.show({
          title: 'Welcome back!',
          message: `Logged in as ${data.user.username}`,
          color: 'green',
        })
        navigate('/', { replace: true })
      })
      .catch((err) => {
        const label = PROVIDER_LABELS[provider] ?? provider
        const message = err?.response?.data?.message ?? `${label} login failed`
        notifications.show({ title: 'Login failed', message, color: 'red' })
        navigate('/login', { replace: true })
      })
  }, [])

  const label = PROVIDER_LABELS[providerRef.current] ?? providerRef.current

  return (
    <Center h="100vh">
      <Stack align="center" gap="xs">
        <Loader size="md" />
        <Text size="sm" c="dimmed">Completing {label} login…</Text>
      </Stack>
    </Center>
  )
}
