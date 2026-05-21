import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiClient } from '../../services/client'
import type { FileItem, FolderItem, ID, ShareLink } from '../../types/domain'

function prettySize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`
  return `${mb.toFixed(1)} MB`
}

export function FilesPage() {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [tree, setTree] = useState<FolderItem[]>([])
  const [shares, setShares] = useState<ShareLink[]>([])
  const [folderId, setFolderId] = useState<ID | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFileName, setNewFileName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const folderOptions = useMemo(
    () => [
      { value: '', label: 'Root' },
      ...tree.map(f => ({ value: f.id, label: f.name })),
    ],
    [tree]
  )

  const load = useCallback(async (): Promise<void> => {
    try {
      const [listing, folderTree, links] = await Promise.all([
        apiClient.files.list(folderId),
        apiClient.folders.tree(),
        apiClient.shares.list(),
      ])
      setFolders(listing.folders)
      setFiles(listing.files)
      setTree(folderTree)
      setShares(links)
      setError(null)
    } catch {
      setError('Failed to load file manager data.')
    }
  }, [folderId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function createFolder() {
    if (!newFolderName.trim()) return
    await apiClient.folders.create(newFolderName.trim(), folderId)
    setNewFolderName('')
    await load()
  }

  async function uploadFile() {
    if (!newFileName.trim()) return
    await apiClient.files.upload({
      name: newFileName.trim(),
      sizeBytes: Math.floor(Math.random() * 900_000) + 50_000,
      mimeType: 'application/octet-stream',
      folderId,
    })
    setNewFileName('')
    await load()
  }

  async function shareFile(fileId: string) {
    await apiClient.shares.create({
      resourceType: 'file',
      resourceId: fileId,
      access: 'download',
      expiresAt: null,
    })
    await load()
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Files</Title>
        <Select
          w={260}
          label="Current folder"
          value={folderId ?? ''}
          data={folderOptions}
          onChange={value => setFolderId(value || null)}
        />
      </Group>

      {error ? <Alert color="red">{error}</Alert> : null}

      <Group grow>
        <Paper withBorder p="md">
          <Stack>
            <Text fw={600}>Create folder</Text>
            <TextInput
              placeholder="Invoices"
              value={newFolderName}
              onChange={e => setNewFolderName(e.currentTarget.value)}
            />
            <Button onClick={() => void createFolder()}>Add folder</Button>
          </Stack>
        </Paper>
        <Paper withBorder p="md">
          <Stack>
            <Text fw={600}>Quick upload</Text>
            <TextInput
              placeholder="contract.pdf"
              value={newFileName}
              onChange={e => setNewFileName(e.currentTarget.value)}
            />
            <Button onClick={() => void uploadFile()}>Add file</Button>
          </Stack>
        </Paper>
      </Group>

      <Paper withBorder p="md">
        <Title order={4} mb="sm">
          Folders
        </Title>
        <Group>
          {folders.length === 0 ? (
            <Text c="dimmed">No folders in this location.</Text>
          ) : null}
          {folders.map(folder => (
            <Badge key={folder.id} variant="light" size="lg">
              {folder.name}
            </Badge>
          ))}
        </Group>
      </Paper>

      <Paper withBorder p="md">
        <Title order={4} mb="sm">
          Files
        </Title>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Size</Table.Th>
              <Table.Th>Share links</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {files.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text c="dimmed">No files in this location.</Text>
                </Table.Td>
              </Table.Tr>
            ) : null}
            {files.map(file => (
              <Table.Tr key={file.id}>
                <Table.Td>{file.name}</Table.Td>
                <Table.Td>{prettySize(file.sizeBytes)}</Table.Td>
                <Table.Td>
                  {shares.filter(s => s.resourceId === file.id).length}
                </Table.Td>
                <Table.Td>
                  <Group>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => void shareFile(file.id)}>
                      Share
                    </Button>
                    <Button
                      size="xs"
                      color="red"
                      variant="light"
                      onClick={() =>
                        void apiClient.files.delete(file.id).then(load)
                      }>
                      Move to trash
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
