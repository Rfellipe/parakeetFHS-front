import {
  Alert,
  Button,
  Paper,
  PasswordInput,
  Stack,
  TextInput,
  Title,
} from '@mantine/core'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('user@fhs.local')
  const [password, setPassword] = useState('demo')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await login(email, password)
      const redirect =
        (location.state as { from?: string } | undefined)?.from ?? '/files'
      navigate(redirect, { replace: true })
    } catch {
      setError('Login failed. Check credentials and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <Paper radius="md" p="xl" withBorder w={420}>
        <form onSubmit={onSubmit}>
          <Stack>
            <Title order={2}>FHS Login</Title>
            {error ? <Alert color="red">{error}</Alert> : null}
            <TextInput
              label="Email"
              value={email}
              onChange={e => setEmail(e.currentTarget.value)}
              required
            />
            <PasswordInput
              label="Password"
              value={password}
              onChange={e => setPassword(e.currentTarget.value)}
              required
            />
            <Button type="submit" loading={submitting}>
              Sign in
            </Button>
          </Stack>
        </form>
      </Paper>
    </div>
  )
}
