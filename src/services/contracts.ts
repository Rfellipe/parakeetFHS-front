import type {
  ApiResponse,
  AuthUser,
  FileItem,
  FileListResult,
  FolderItem,
  ID,
  PublicShareView,
  ShareAccess,
  ShareLink,
  StorageUsage,
  TokenInfo,
} from '../types/domain'

export type TokenReturn = ApiResponse<TokenInfo>

export type UploadInput = {
  name: string
  sizeBytes: number
  mimeType: string
  folderId: ID | null
}

export type CreateShareInput = {
  resourceType: 'file' | 'folder'
  resourceId: ID
  expiresAt: string | null
  access: ShareAccess
}

export interface AuthService {
  login(email: string, pass: string): Promise<TokenReturn>
  refresh(): Promise<TokenReturn>
  logout(): Promise<void>
  me(): Promise<AuthUser>
}

export interface FileService {
  list(folderId: ID | null): Promise<FileListResult>
  listTrash(): Promise<FileItem[]>
  upload(input: UploadInput): Promise<FileItem>
  rename(fileId: ID, newName: string): Promise<FileItem>
  move(fileId: ID, targetFolderId: ID | null): Promise<FileItem>
  delete(fileId: ID): Promise<void>
  restore(fileId: ID): Promise<void>
  purge(fileId: ID): Promise<void>
}

export interface FolderService {
  tree(): Promise<FolderItem[]>
  listTrash(): Promise<FolderItem[]>
  create(name: string, parentId: ID | null): Promise<FolderItem>
  rename(folderId: ID, newName: string): Promise<FolderItem>
  move(folderId: ID, targetParentId: ID | null): Promise<FolderItem>
  delete(folderId: ID): Promise<void>
  restore(folderId: ID): Promise<void>
  purge(folderId: ID): Promise<void>
}

export interface ShareService {
  list(resourceId?: ID): Promise<ShareLink[]>
  create(input: CreateShareInput): Promise<ShareLink>
  revoke(linkId: ID): Promise<void>
  getPublic(token: string): Promise<PublicShareView>
}

export interface UsageService {
  getUsage(): Promise<StorageUsage>
}

export interface ApiServices {
  auth: AuthService
  files: FileService
  folders: FolderService
  shares: ShareService
  usage: UsageService
}
