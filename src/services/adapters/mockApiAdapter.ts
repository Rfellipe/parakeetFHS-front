import type {
  ApiServices,
  CreateShareInput,
  FileService,
  FolderService,
  ShareService,
  UploadInput,
} from '../contracts'
import type {
  AuthUser,
  FileItem,
  FileListResult,
  FolderItem,
  ID,
  PublicShareView,
  ShareLink,
  StorageUsage,
} from '../../types/domain'

const STORAGE_KEY = 'fhs-mock-db'
const TOKEN_KEY = 'fhs-mock-session'

type MockDB = {
  files: FileItem[]
  folders: FolderItem[]
  shares: ShareLink[]
  usage: StorageUsage
}

const now = () => new Date().toISOString()

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function getInitialDB(): MockDB {
  return {
    folders: [
      {
        id: 'fold_root_docs',
        name: 'Documents',
        parentId: null,
        createdAt: now(),
        trashedAt: null,
      },
      {
        id: 'fold_root_media',
        name: 'Media',
        parentId: null,
        createdAt: now(),
        trashedAt: null,
      },
    ],
    files: [
      {
        id: 'file_demo_1',
        name: 'welcome.txt',
        folderId: 'fold_root_docs',
        sizeBytes: 14_000,
        mimeType: 'text/plain',
        createdAt: now(),
        trashedAt: null,
      },
    ],
    shares: [],
    usage: { usedBytes: 14_000, totalBytes: 10 * 1024 * 1024 * 1024 },
  }
}

function loadDB(): MockDB {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seed = getInitialDB()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
  return JSON.parse(raw) as MockDB
}

function saveDB(db: MockDB): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

function requireAuth(): void {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) {
    throw new Error('UNAUTHORIZED')
  }
}

const mockUser: AuthUser = {
  id: 'usr_1',
  name: 'FHS User',
  email: 'user@fhs.local',
}

const filesService: FileService = {
  async list(folderId: ID | null): Promise<FileListResult> {
    requireAuth()
    const db = loadDB()
    return {
      folders: db.folders.filter(f => f.parentId === folderId && !f.trashedAt),
      files: db.files.filter(f => f.folderId === folderId && !f.trashedAt),
    }
  },
  async listTrash(): Promise<FileItem[]> {
    requireAuth()
    const db = loadDB()
    return db.files.filter(f => !!f.trashedAt)
  },

  async upload(input: UploadInput): Promise<FileItem> {
    requireAuth()
    const db = loadDB()
    const file: FileItem = {
      id: randomId('file'),
      name: input.name,
      folderId: input.folderId,
      sizeBytes: input.sizeBytes,
      mimeType: input.mimeType,
      createdAt: now(),
      trashedAt: null,
    }
    db.files.push(file)
    db.usage.usedBytes += file.sizeBytes
    saveDB(db)
    return file
  },

  async rename(fileId: ID, newName: string): Promise<FileItem> {
    requireAuth()
    const db = loadDB()
    const file = db.files.find(f => f.id === fileId)
    if (!file) throw new Error('NOT_FOUND')
    file.name = newName
    saveDB(db)
    return file
  },

  async move(fileId: ID, targetFolderId: ID | null): Promise<FileItem> {
    requireAuth()
    const db = loadDB()
    const file = db.files.find(f => f.id === fileId)
    if (!file) throw new Error('NOT_FOUND')
    file.folderId = targetFolderId
    saveDB(db)
    return file
  },

  async delete(fileId: ID): Promise<void> {
    requireAuth()
    const db = loadDB()
    const file = db.files.find(f => f.id === fileId)
    if (!file) throw new Error('NOT_FOUND')
    file.trashedAt = now()
    saveDB(db)
  },

  async restore(fileId: ID): Promise<void> {
    requireAuth()
    const db = loadDB()
    const file = db.files.find(f => f.id === fileId)
    if (!file) throw new Error('NOT_FOUND')
    file.trashedAt = null
    saveDB(db)
  },

  async purge(fileId: ID): Promise<void> {
    requireAuth()
    const db = loadDB()
    const idx = db.files.findIndex(f => f.id === fileId)
    if (idx < 0) throw new Error('NOT_FOUND')
    db.usage.usedBytes = Math.max(
      0,
      db.usage.usedBytes - db.files[idx].sizeBytes
    )
    db.files.splice(idx, 1)
    saveDB(db)
  },
}

const foldersService: FolderService = {
  async tree(): Promise<FolderItem[]> {
    requireAuth()
    return loadDB().folders.filter(f => !f.trashedAt)
  },
  async listTrash(): Promise<FolderItem[]> {
    requireAuth()
    return loadDB().folders.filter(f => !!f.trashedAt)
  },

  async create(name: string, parentId: ID | null): Promise<FolderItem> {
    requireAuth()
    const db = loadDB()
    const folder: FolderItem = {
      id: randomId('fold'),
      name,
      parentId,
      createdAt: now(),
      trashedAt: null,
    }
    db.folders.push(folder)
    saveDB(db)
    return folder
  },

  async rename(folderId: ID, newName: string): Promise<FolderItem> {
    requireAuth()
    const db = loadDB()
    const folder = db.folders.find(f => f.id === folderId)
    if (!folder) throw new Error('NOT_FOUND')
    folder.name = newName
    saveDB(db)
    return folder
  },

  async move(folderId: ID, targetParentId: ID | null): Promise<FolderItem> {
    requireAuth()
    const db = loadDB()
    const folder = db.folders.find(f => f.id === folderId)
    if (!folder) throw new Error('NOT_FOUND')
    folder.parentId = targetParentId
    saveDB(db)
    return folder
  },

  async delete(folderId: ID): Promise<void> {
    requireAuth()
    const db = loadDB()
    const folder = db.folders.find(f => f.id === folderId)
    if (!folder) throw new Error('NOT_FOUND')
    folder.trashedAt = now()
    db.files
      .filter(f => f.folderId === folderId)
      .forEach(file => {
        file.trashedAt = now()
      })
    saveDB(db)
  },

  async restore(folderId: ID): Promise<void> {
    requireAuth()
    const db = loadDB()
    const folder = db.folders.find(f => f.id === folderId)
    if (!folder) throw new Error('NOT_FOUND')
    folder.trashedAt = null
    saveDB(db)
  },

  async purge(folderId: ID): Promise<void> {
    requireAuth()
    const db = loadDB()
    const fileIds = new Set(
      db.files.filter(f => f.folderId === folderId).map(f => f.id)
    )
    db.files = db.files.filter(f => !fileIds.has(f.id))
    db.folders = db.folders.filter(f => f.id !== folderId)
    saveDB(db)
  },
}

const sharesService: ShareService = {
  async list(resourceId?: ID): Promise<ShareLink[]> {
    requireAuth()
    const all = loadDB().shares.filter(s => !s.revokedAt)
    if (!resourceId) return all
    return all.filter(s => s.resourceId === resourceId)
  },

  async create(input: CreateShareInput): Promise<ShareLink> {
    requireAuth()
    const db = loadDB()
    const link: ShareLink = {
      id: randomId('shr'),
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      token: randomId('pub'),
      expiresAt: input.expiresAt,
      access: input.access,
      revokedAt: null,
      createdAt: now(),
    }
    db.shares.push(link)
    saveDB(db)
    return link
  },

  async revoke(linkId: ID): Promise<void> {
    requireAuth()
    const db = loadDB()
    const link = db.shares.find(s => s.id === linkId)
    if (!link) throw new Error('NOT_FOUND')
    link.revokedAt = now()
    saveDB(db)
  },

  async getPublic(token: string): Promise<PublicShareView> {
    const db = loadDB()
    const link = db.shares.find(s => s.token === token && !s.revokedAt)
    if (!link) throw new Error('NOT_FOUND')
    if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
      throw new Error('EXPIRED')
    }

    const resourceName =
      link.resourceType === 'file'
        ? db.files.find(f => f.id === link.resourceId)?.name
        : db.folders.find(f => f.id === link.resourceId)?.name

    return {
      token,
      resourceName: resourceName ?? 'Unknown resource',
      resourceType: link.resourceType,
      access: link.access,
      expiresAt: link.expiresAt,
    }
  },
}

export const mockApiServices: ApiServices = {
  auth: {
    async login(email: string, password: string): Promise<AuthUser> {
      void password
      localStorage.setItem(TOKEN_KEY, `token:${email}`)
      return { ...mockUser, email }
    },
    async refresh(): Promise<AuthUser> {
      requireAuth()
      return mockUser
    },
    async logout(): Promise<void> {
      localStorage.removeItem(TOKEN_KEY)
    },
    async me(): Promise<AuthUser> {
      requireAuth()
      return mockUser
    },
  },
  files: filesService,
  folders: foldersService,
  shares: sharesService,
  usage: {
    async getUsage(): Promise<StorageUsage> {
      requireAuth()
      return loadDB().usage
    },
  },
}
