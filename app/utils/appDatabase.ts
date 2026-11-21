import type { LotteryTicket } from '~/stores/lottery'

export interface AppSettingsSnapshot {
  monthlyBudget?: number
  defaultOrganization?: 'onlae' | 'once' | 'otros'
  currency?: string
}

export interface AppDatabaseState {
  tickets: LotteryTicket[]
  settings: AppSettingsSnapshot | null
}

export type UiPreferences = Record<string, boolean | string | number | null>

export interface AppDatabaseUsageStats {
  appStateBytes: number
  attachmentBytes: number
  attachmentCount: number
  totalBytes: number
  browserUsageBytes?: number
  browserQuotaBytes?: number
}

export const APP_DB_NAME = 'loterias-pwa'
export const APP_DB_VERSION = 2

export const APP_STORE_NAMES = {
  ticketPhotos: 'ticketPhotos',
  appState: 'appState'
} as const

export const APP_STATE_KEYS = {
  tickets: 'tickets',
  settings: 'settings',
  uiPreferences: 'uiPreferences',
  migrationVersion: 'migrationVersion'
} as const

const isIndexedDbAvailable = () => typeof indexedDB !== 'undefined'

let dbPromise: Promise<IDBDatabase> | null = null

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })

const jsonByteSize = (value: unknown): number => new Blob([JSON.stringify(value)]).size

const dataUrlByteSize = (dataUrl: string): number => {
  const commaIndex = dataUrl.indexOf(',')
  const base64 = commaIndex === -1 ? dataUrl : dataUrl.slice(commaIndex + 1)
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding)
}

export const openAppDatabase = (): Promise<IDBDatabase> => {
  if (!isIndexedDbAvailable()) {
    return Promise.reject(new Error('IndexedDB is not available'))
  }

  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(APP_DB_NAME, APP_DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(APP_STORE_NAMES.ticketPhotos)) {
        db.createObjectStore(APP_STORE_NAMES.ticketPhotos, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(APP_STORE_NAMES.appState)) {
        db.createObjectStore(APP_STORE_NAMES.appState, { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open IndexedDB'))
  })

  return dbPromise
}

export const runObjectStoreTransaction = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await openAppDatabase()
  const transaction = db.transaction(storeName, mode)
  const store = transaction.objectStore(storeName)
  const request = callback(store)
  return requestToPromise(request)
}

export const getAppStateValue = async <T>(key: string): Promise<T | null> => {
  if (!isIndexedDbAvailable()) return null
  try {
    const record = await runObjectStoreTransaction<{ key: string, value: T } | undefined>(
      APP_STORE_NAMES.appState,
      'readonly',
      store => store.get(key)
    )
    return record?.value ?? null
  } catch (error) {
    console.error(`Error reading ${key} from IndexedDB:`, error)
    return null
  }
}

export const setAppStateValue = async <T>(key: string, value: T): Promise<void> => {
  if (!isIndexedDbAvailable()) return
  try {
    await runObjectStoreTransaction(
      APP_STORE_NAMES.appState,
      'readwrite',
      store => store.put({ key, value })
    )
  } catch (error) {
    console.error(`Error writing ${key} to IndexedDB:`, error)
  }
}

export const deleteAppStateValue = async (key: string): Promise<void> => {
  if (!isIndexedDbAvailable()) return
  try {
    await runObjectStoreTransaction(
      APP_STORE_NAMES.appState,
      'readwrite',
      store => store.delete(key)
    )
  } catch (error) {
    console.error(`Error deleting ${key} from IndexedDB:`, error)
  }
}

export const getTickets = async (): Promise<LotteryTicket[] | null> => {
  return getAppStateValue<LotteryTicket[]>(APP_STATE_KEYS.tickets)
}

export const setTickets = async (tickets: LotteryTicket[]): Promise<void> => {
  return setAppStateValue(APP_STATE_KEYS.tickets, tickets)
}

export const getSettings = async (): Promise<AppSettingsSnapshot | null> => {
  return getAppStateValue<AppSettingsSnapshot>(APP_STATE_KEYS.settings)
}

export const setSettings = async (settings: AppSettingsSnapshot): Promise<void> => {
  return setAppStateValue(APP_STATE_KEYS.settings, settings)
}

export const getDatabaseUsageStats = async (): Promise<AppDatabaseUsageStats> => {
  let appStateBytes = 0
  let attachmentBytes = 0
  let attachmentCount = 0

  if (isIndexedDbAvailable()) {
    try {
      const db = await openAppDatabase()
      const tx = db.transaction([APP_STORE_NAMES.appState, APP_STORE_NAMES.ticketPhotos], 'readonly')

      const appStateStore = tx.objectStore(APP_STORE_NAMES.appState)
      const allAppState = await requestToPromise<Array<{ key: string, value: unknown }>>(appStateStore.getAll())
      appStateBytes = allAppState.reduce((acc, entry) => acc + jsonByteSize(entry.value), 0)

      const attachmentsStore = tx.objectStore(APP_STORE_NAMES.ticketPhotos)
      const allAttachments = await requestToPromise<Array<{ size?: number, dataUrl?: string }>>(attachmentsStore.getAll())
      attachmentCount = allAttachments.length
      attachmentBytes = allAttachments.reduce((acc, att) => {
        return acc + (att.size ?? (att.dataUrl ? dataUrlByteSize(att.dataUrl) : 0))
      }, 0)
    } catch (e) {
      console.warn('Error reading stats:', e)
    }
  }

  let browserUsageBytes: number | undefined
  let browserQuotaBytes: number | undefined

  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate()
      browserUsageBytes = estimate.usage
      browserQuotaBytes = estimate.quota
    } catch {
      // ignore
    }
  }

  return {
    appStateBytes,
    attachmentBytes,
    attachmentCount,
    totalBytes: appStateBytes + attachmentBytes,
    browserUsageBytes,
    browserQuotaBytes
  }
}
