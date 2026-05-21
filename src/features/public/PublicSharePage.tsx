import { Alert, Paper, Stack, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiClient } from '../../services/client'
import type { PublicShareView } from '../../types/domain'

export function PublicSharePage() {
  const { token = '' } = useParams()
  const [data, setData] = useState<PublicShareView | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void apiClient.shares
      .getPublic(token)
      .then((res) => {
        setData(res)
        setError(null)
      })
      .catch(() => {
        setError('This share link is invalid or expired.')
      })
  }, [token])

  return (
    <div className="auth-page">
      <Paper withBorder p="xl" w={520}>
        <Stack>
          <Title order={2}>Public Share</Title>
          {error ? <Alert color="red">{error}</Alert> : null}
          {data ? (
            <>
              <Text>{data.resourceName}</Text>
              <Text c="dimmed">Type: {data.resourceType}</Text>
              <Text c="dimmed">Access: {data.access}</Text>
              <Text c="dimmed">Expires: {data.expiresAt ?? 'Never'}</Text>
            </>
          ) : null}
        </Stack>
      </Paper>
    </div>
  )
}
