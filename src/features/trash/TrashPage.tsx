import { Button, Group, Paper, Stack, Table, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { apiClient } from '../../services/client'
import type { FileItem, FolderItem } from '../../types/domain'

export function TrashPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])

  async function load() {
    const [trashedFiles, trashedFolders] = await Promise.all([
      apiClient.files.listTrash(),
      apiClient.folders.listTrash(),
    ])
    setFiles(trashedFiles)
    setFolders(trashedFolders)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [])

  return (
    <Stack>
      <Title order={2}>Trash</Title>
      <Paper withBorder p="md">
        <Title order={4} mb="sm">
          Folders
        </Title>
        <Table mb="lg">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Deleted at</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {folders.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text c="dimmed">No folders in trash.</Text>
                </Table.Td>
              </Table.Tr>
            ) : null}
            {folders.map((folder) => (
              <Table.Tr key={folder.id}>
                <Table.Td>{folder.name}</Table.Td>
                <Table.Td>{folder.trashedAt}</Table.Td>
                <Table.Td>
                  <Group>
                    <Button size="xs" variant="light" onClick={() => void apiClient.folders.restore(folder.id).then(load)}>
                      Restore
                    </Button>
                    <Button size="xs" color="red" variant="light" onClick={() => void apiClient.folders.purge(folder.id).then(load)}>
                      Delete forever
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Title order={4} mb="sm">
          Files
        </Title>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Deleted at</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {files.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text c="dimmed">Trash is empty.</Text>
                </Table.Td>
              </Table.Tr>
            ) : null}
            {files.map((file) => (
              <Table.Tr key={file.id}>
                <Table.Td>{file.name}</Table.Td>
                <Table.Td>{file.trashedAt}</Table.Td>
                <Table.Td>
                  <Group>
                    <Button size="xs" variant="light" onClick={() => void apiClient.files.restore(file.id).then(load)}>
                      Restore
                    </Button>
                    <Button size="xs" color="red" variant="light" onClick={() => void apiClient.files.purge(file.id).then(load)}>
                      Delete forever
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}
