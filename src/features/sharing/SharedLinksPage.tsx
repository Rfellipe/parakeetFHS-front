import { Alert, Button, Paper, Stack, Table, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { apiClient } from '../../services/client'
import type { ShareLink } from '../../types/domain'

export function SharedLinksPage() {
  const [links, setLinks] = useState<ShareLink[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setLinks(await apiClient.shares.list())
      setError(null)
    } catch {
      setError('Failed to load shared links.')
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [])

  return (
    <Stack>
      <Title order={2}>Shared Links</Title>
      {error ? <Alert color="red">{error}</Alert> : null}
      <Paper withBorder p="md">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Token</Table.Th>
              <Table.Th>Resource</Table.Th>
              <Table.Th>Access</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {links.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text c="dimmed">No active links.</Text>
                </Table.Td>
              </Table.Tr>
            ) : null}
            {links.map(link => (
              <Table.Tr key={link.id}>
                <Table.Td>{link.token}</Table.Td>
                <Table.Td>{`${link.resourceType}:${link.resourceId}`}</Table.Td>
                <Table.Td>{link.access}</Table.Td>
                <Table.Td>
                  <Button
                    size="xs"
                    color="red"
                    variant="light"
                    onClick={() =>
                      void apiClient.shares.revoke(link.id).then(load)
                    }>
                    Revoke
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}
