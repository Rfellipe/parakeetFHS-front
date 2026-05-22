import type {
  ApiServices,
  AuthService,
  FileService,
  FolderService,
  ShareService,
  TokenReturn,
  UsageService,
  UploadInput,
} from '../contracts'
import type {
  ApiResponse,
  AuthUser,
  FileItem,
  FileListResult,
  FolderItem,
  ID,
  PublicShareView,
  ShareLink,
  StorageUsage,
} from '../../types/domain'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown>
}

type NodeChildrenResponse = {
  folders?: FolderItem[]
  files?: FileItem[]
  nodes?: Array<FolderItem | FileItem>
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (!isObject(value) || !('success' in value)) return false
  return typeof value.success === 'boolean'
}

function isFolderItem(node: unknown): node is FolderItem {
  return (
    isObject(node) &&
    typeof node.id === 'string' &&
    typeof node.name === 'string' &&
    'parentId' in node
  )
}

function isFileItem(node: unknown): node is FileItem {
  return (
    isObject(node) &&
    typeof node.id === 'string' &&
    typeof node.name === 'string' &&
    'mimeType' in node &&
    'sizeBytes' in node
  )
}

class HttpApiAdapter implements ApiServices {
  private readonly baseUrl: string
  private sessionToken = ''
  // private exp_time: number

  public readonly auth: AuthService
  public readonly files: FileService
  public readonly folders: FolderService
  public readonly shares: ShareService
  public readonly usage: UsageService

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.auth = {
      login: async (email: string, pass: string): Promise<TokenReturn> => {
        const response = await this.requestApi<TokenReturn>('/auth/login', {
          method: 'POST',
          body: { email, pass },
        })

        if (!response.success) {
          throw new Error(response.error.message)
        }

        this.sessionToken = response.data.accessToken

        return response
      },
      refresh: async (): Promise<TokenReturn> => {
        const response = await this.requestApi<TokenReturn>('/auth/refresh', {
          method: 'POST',
        })

        if (response.success) {
          this.sessionToken = response.data.accessToken
        }

        return response
      },
      logout: async (): Promise<void> => {
        await this.request<void>('/auth/logout', { method: 'POST' })
      },
      me: async (): Promise<AuthUser> => {
        return this.request<AuthUser>('/auth/me')
      },
    }

    this.files = {
      list: async (folderId: ID | null): Promise<FileListResult> => {
        const nodeId = folderId ?? 'root'
        const res = await this.request<NodeChildrenResponse>(
          `/nodes/${encodeURIComponent(nodeId)}/children`
        )

        if (Array.isArray(res.folders) || Array.isArray(res.files)) {
          return {
            folders: res.folders ?? [],
            files: res.files ?? [],
          }
        }

        const nodes = Array.isArray(res.nodes) ? res.nodes : []
        return {
          folders: nodes.filter(isFolderItem),
          files: nodes.filter(isFileItem),
        }
      },
      listTrash: async (): Promise<FileItem[]> => {
        const trash = await this.request<Array<FolderItem | FileItem>>('/trash')
        return trash.filter(isFileItem)
      },
      upload: async (input: UploadInput): Promise<FileItem> => {
        const form = new FormData()
        if (input.folderId) {
          form.append('parentId', input.folderId)
        }
        const bytes = new Uint8Array(Math.max(1, input.sizeBytes))
        form.append(
          'file',
          new File([bytes], input.name, { type: input.mimeType })
        )

        return this.request<FileItem>('/files', {
          method: 'POST',
          body: form,
        })
      },
      rename: async (fileId: ID, newName: string): Promise<FileItem> => {
        return this.request<FileItem>(`/nodes/${encodeURIComponent(fileId)}`, {
          method: 'PATCH',
          body: { name: newName },
        })
      },
      move: async (
        fileId: ID,
        targetFolderId: ID | null
      ): Promise<FileItem> => {
        return this.request<FileItem>(`/nodes/${encodeURIComponent(fileId)}`, {
          method: 'PATCH',
          body: { parentId: targetFolderId },
        })
      },
      delete: async (fileId: ID): Promise<void> => {
        await this.request<void>(`/nodes/${encodeURIComponent(fileId)}`, {
          method: 'DELETE',
        })
      },
      restore: async (fileId: ID): Promise<void> => {
        await this.request<void>(
          `/nodes/${encodeURIComponent(fileId)}/restore`,
          {
            method: 'POST',
          }
        )
      },
      purge: async (fileId: ID): Promise<void> => {
        await this.request<void>(
          `/nodes/${encodeURIComponent(fileId)}/permanent`,
          {
            method: 'DELETE',
          }
        )
      },
    }

    this.folders = {
      tree: async (): Promise<FolderItem[]> => {
        const root = await this.request<FolderItem>('/nodes/root')
        const children = await this.request<NodeChildrenResponse>(
          '/nodes/root/children'
        )

        const folders = Array.isArray(children.folders)
          ? children.folders
          : (children.nodes ?? []).filter(isFolderItem)

        return [root, ...folders]
      },
      listTrash: async (): Promise<FolderItem[]> => {
        const trash = await this.request<Array<FolderItem | FileItem>>('/trash')
        return trash.filter(isFolderItem)
      },
      create: async (
        name: string,
        parentId: ID | null
      ): Promise<FolderItem> => {
        return this.request<FolderItem>('/folders', {
          method: 'POST',
          body: { name, parentId: parentId ?? undefined },
          headers: {
            Authorization: `Bearer ${this.sessionToken}`,
          },
        })
      },
      rename: async (folderId: ID, newName: string): Promise<FolderItem> => {
        return this.request<FolderItem>(
          `/nodes/${encodeURIComponent(folderId)}`,
          {
            method: 'PATCH',
            body: { name: newName },
          }
        )
      },
      move: async (
        folderId: ID,
        targetParentId: ID | null
      ): Promise<FolderItem> => {
        return this.request<FolderItem>(
          `/nodes/${encodeURIComponent(folderId)}`,
          {
            method: 'PATCH',
            body: { parentId: targetParentId },
          }
        )
      },
      delete: async (folderId: ID): Promise<void> => {
        await this.request<void>(`/nodes/${encodeURIComponent(folderId)}`, {
          method: 'DELETE',
        })
      },
      restore: async (folderId: ID): Promise<void> => {
        await this.request<void>(
          `/nodes/${encodeURIComponent(folderId)}/restore`,
          {
            method: 'POST',
          }
        )
      },
      purge: async (folderId: ID): Promise<void> => {
        await this.request<void>(
          `/nodes/${encodeURIComponent(folderId)}/permanent`,
          {
            method: 'DELETE',
          }
        )
      },
    }

    this.shares = {
      list: async (): Promise<ShareLink[]> => {
        return this.request<ShareLink[]>('/shares')
      },
      create: async input => {
        return this.request<ShareLink>('/shares', {
          method: 'POST',
          body: input,
        })
      },
      revoke: async (linkId: ID): Promise<void> => {
        await this.request<void>(`/shares/${encodeURIComponent(linkId)}`, {
          method: 'DELETE',
        })
      },
      getPublic: async (token: string): Promise<PublicShareView> => {
        return this.request<PublicShareView>(`/shares/public/${token}`)
      },
    }

    this.usage = {
      getUsage: async (): Promise<StorageUsage> => {
        return this.request<StorageUsage>('/usage')
      },
    }
  }

  private async request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers = new Headers(options.headers)

    let body: BodyInit | undefined
    if (options.body instanceof FormData) {
      body = options.body
    } else if (isObject(options.body)) {
      headers.set('Content-Type', 'application/json')
      body = JSON.stringify(options.body)
    } else {
      body = options.body
    }

    const response = await fetch(url, {
      ...options,
      headers,
      body,
      credentials: 'include',
    })

    const text = await response.text()
    const payload = text ? (JSON.parse(text) as unknown) : undefined

    if (!response.ok) {
      if (isApiResponse<unknown>(payload) && !payload.success) {
        throw new Error(payload.error.message)
      }

      if (isObject(payload) && typeof payload.message === 'string') {
        throw new Error(payload.message)
      }

      throw new Error(`HTTP ${response.status}`)
    }

    if (typeof payload === 'undefined') {
      return undefined as T
    }

    return payload as T
  }

  private async requestApi<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(path, options)
  }
}

export { HttpApiAdapter as CreateHttpApiServices }
