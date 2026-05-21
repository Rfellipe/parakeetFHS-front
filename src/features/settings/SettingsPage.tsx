import { Paper, Progress, Stack, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { apiClient } from '../../services/client'
import type { StorageUsage } from '../../types/domain'

function bytesToGb(bytes: number): string {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function SettingsPage() {
  const [usage, setUsage] = useState<StorageUsage | null>(null)

  useEffect(() => {
    void apiClient.usage.getUsage().then(setUsage)
  }, [])

  const ratio = usage ? Math.min(100, (usage.usedBytes / usage.totalBytes) * 100) : 0

  return (
    <Stack>
      <Title order={2}>Settings</Title>
      <Paper withBorder p="md">
        <Stack>
          <Text fw={600}>Storage usage</Text>
          <Progress value={ratio} />
          <Text size="sm" c="dimmed">
            {usage ? `${bytesToGb(usage.usedBytes)} / ${bytesToGb(usage.totalBytes)}` : 'Loading...'}
          </Text>
        </Stack>
      </Paper>
    </Stack>
  )
}
