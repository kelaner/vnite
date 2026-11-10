import { safeStorage } from 'electron'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { ipcManager } from './IPCManager'

function isStorageAvailable(): boolean {
  return (
    safeStorage.isEncryptionAvailable() &&
    (process.platform !== 'linux' || safeStorage.getSelectedStorageBackend() !== 'basic_text')
  )
}

function getTokenPath(): string {
  const base =
    process.platform === 'win32'
      ? process.env.LOCALAPPDATA
      : process.platform === 'darwin'
        ? path.join(os.homedir(), 'Library', 'Application Support')
        : path.join(os.homedir(), '.local', 'share')
  if (!base) throw new Error('Local token storage is unavailable')
  return path.join(base, 'vnite', 'credentials', 'bangumi-token')
}

export async function getBangumiToken(): Promise<string | null> {
  let encrypted: Buffer
  try {
    encrypted = await fs.readFile(getTokenPath())
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw new Error('Unable to read Bangumi token')
  }
  if (!isStorageAvailable()) throw new Error('Secure token storage is unavailable')
  try {
    return safeStorage.decryptString(encrypted)
  } catch {
    throw new Error('Unable to decrypt Bangumi token')
  }
}

export function setupBangumiTokenIPC(): void {
  ipcManager.handle('bangumi-token:get-status', async () => {
    const available = isStorageAvailable()
    try {
      await fs.access(getTokenPath())
      return { available, configured: true }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { available, configured: false }
      }
      throw new Error('Unable to read Bangumi token status')
    }
  })

  ipcManager.handle('bangumi-token:set', async (_event, token) => {
    if (typeof token !== 'string' || !token.trim() || /[\r\n]/.test(token)) {
      throw new Error('Invalid Bangumi token')
    }
    if (!isStorageAvailable()) throw new Error('Secure token storage is unavailable')
    try {
      const file = getTokenPath()
      const encrypted = safeStorage.encryptString(token.trim())
      await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 })
      await fs.writeFile(file, Uint8Array.from(encrypted), { mode: 0o600 })
    } catch {
      throw new Error('Unable to store Bangumi token')
    }
  })

  ipcManager.handle('bangumi-token:clear', async () => {
    try {
      await fs.rm(getTokenPath(), { force: true })
    } catch {
      throw new Error('Unable to clear Bangumi token')
    }
  })
}
