import type { LoginInfo } from '../services/contracts'

export type ID = string

export type AuthUser = {
  id: ID
  email: string
  status: string
  rootDirId: string
  loginAttempts: number
}

export type StorageUsage = {
  usedBytes: number
  totalBytes: number
}

export type FolderItem = {
  id: ID
  name: string
  parentId: ID | null
  createdAt: string
  trashedAt: string | null
}

export type FileItem = {
  id: ID
  name: string
  folderId: ID | null
  sizeBytes: number
  mimeType: string
  createdAt: string
  trashedAt: string | null
}

export type ShareAccess = 'view' | 'download'

export type ShareLink = {
  id: ID
  resourceType: 'file' | 'folder'
  resourceId: ID
  token: string
  expiresAt: string | null
  access: ShareAccess
  revokedAt: string | null
  createdAt: string
}

export type PublicShareView = {
  token: string
  resourceName: string
  resourceType: 'file' | 'folder'
  access: ShareAccess
  expiresAt: string | null
}

export type FileListResult = {
  folders: FolderItem[]
  files: FileItem[]
}

export type ApiResponse<T> =
  | {
      success: true
      data: T
      error?: never
    }
  | {
      success: false
      data?: never
      error: {
        code: number
        message: string
      }
    }

export type Message = { message: string }

export type AuthReturn = ApiResponse<LoginInfo>
export type LogoutReturn = ApiResponse<Message>
