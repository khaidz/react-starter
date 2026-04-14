import { Button, Divider, Group, Paper, PasswordInput, Stack, Text, TextInput, Tooltip } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { IconBrandAzure, IconBrandGithub, IconBrandGoogle, IconLock, IconUser } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import styles from './login.module.scss'

const OAUTH_CALLBACK_URI = `${window.location.origin}/auth/callback`

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (v) => (!v.trim() ? 'Username is required' : null),
      password: (v) => (!v ? 'Password is required' : null),
    },
  })

  const { mutate: login, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      // Lưu token trước, sau đó lấy profile
      setAuth(data.accessToken, data.refreshToken, data.user)
      notifications.show({
        title: 'Welcome back!',
        message: `Logged in as ${data.user.username}`,
        color: 'green',
      })
      navigate('/', { replace: true })
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      notifications.show({
        title: 'Login failed',
        message: error.response?.data?.message ?? error.message ?? 'Invalid username or password',
        color: 'red',
      })
    },
  })

  const handleSubmit = form.onSubmit((values) => {
    login(values)
  })

  const handleOAuthLogin = async (provider: string) => {
    setOauthLoading(provider)
    try {
      sessionStorage.setItem('oauth_provider', provider)
      const { authorizationUrl } = await authApi.getOAuthAuthorizeUrl(provider, OAUTH_CALLBACK_URI)
      window.location.href = authorizationUrl
    } catch {
      sessionStorage.removeItem('oauth_provider')
      notifications.show({ title: 'Error', message: `Could not initiate ${provider} login`, color: 'red' })
      setOauthLoading(null)
    }
  }

  return (
    <Paper className={styles.card} shadow="md" radius="lg">
      <Text className={styles.cardTitle}>Welcome Back</Text>
      <Text className={styles.cardSubtitle}>Please enter your details to sign in</Text>

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Username"
            placeholder="Your username"
            leftSection={<IconUser size={16} color="#9ca3af" />}
            {...form.getInputProps('username')}
          />

          <PasswordInput
            label="Password"
            placeholder="••••••••"
            leftSection={<IconLock size={16} color="#9ca3af" />}
            {...form.getInputProps('password')}
          />

          <Button type="submit" fullWidth loading={isPending} className={styles.submitBtn}>
            Log In to Account
          </Button>

          <Divider label="OR CONTINUE WITH" labelPosition="center" />

          <Group grow gap="sm">
            <Tooltip label="Google" withArrow>
              <Button
                variant="outline"
                className={styles.qrBtn}
                leftSection={<IconBrandGoogle size={18} color="#ea4335" />}
                loading={oauthLoading === 'google'}
                disabled={oauthLoading !== null}
                onClick={() => handleOAuthLogin('google')}
              >
                Google
              </Button>
            </Tooltip>

            <Tooltip label="GitHub" withArrow>
              <Button
                variant="outline"
                className={styles.qrBtn}
                leftSection={<IconBrandGithub size={18} color="#24292e" />}
                loading={oauthLoading === 'github'}
                disabled={oauthLoading !== null}
                onClick={() => handleOAuthLogin('github')}
              >
                GitHub
              </Button>
            </Tooltip>

            <Tooltip label="Azure AD" withArrow>
              <Button
                variant="outline"
                className={styles.qrBtn}
                leftSection={<IconBrandAzure size={18} color="#0078d4" />}
                loading={oauthLoading === 'microsoft'}
                disabled={oauthLoading !== null}
                onClick={() => handleOAuthLogin('microsoft')}
              >
                Azure AD
              </Button>
            </Tooltip>
          </Group>

          <Text className={styles.bottomText}></Text>
        </Stack>
      </form>
    </Paper>
  )
}
