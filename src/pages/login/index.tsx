import { Button, Divider, Paper, PasswordInput, Stack, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { IconBrandAzure, IconLock, IconUser } from '@tabler/icons-react'
import { useNavigate } from 'react-router'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import styles from './login.module.scss'

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

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

          <Button
            variant="outline"
            fullWidth
            className={styles.qrBtn}
            leftSection={<IconBrandAzure size={20} color="#0078d4" />}
          >
            Login with Azure AD
          </Button>

          <Text className={styles.bottomText}></Text>
        </Stack>
      </form>
    </Paper>
  )
}
