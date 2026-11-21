import { APP_STORE_NAMES, runObjectStoreTransaction } from '~/utils/appDatabase'

export interface LotteryAttachment {
  id: string
  dataUrl: string
  name?: string
  type?: string
  size?: number
}

const STORE_NAME = APP_STORE_NAMES.ticketPhotos

const dataUrlByteSize = (dataUrl: string): number => {
  const commaIndex = dataUrl.indexOf(',')
  const base64 = commaIndex === -1 ? dataUrl : dataUrl.slice(commaIndex + 1)
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding)
}

export const getAttachmentSize = (attachment: Pick<LotteryAttachment, 'dataUrl' | 'size'>): number =>
  attachment.size ?? dataUrlByteSize(attachment.dataUrl)

export const buildLotteryAttachmentId = (ticketId: string): string => `ticket_photo:${ticketId}`

export const saveLotteryAttachment = async (attachment: LotteryAttachment): Promise<LotteryAttachment> => {
  const storedAttachment = {
    ...attachment,
    size: getAttachmentSize(attachment)
  }
  await runObjectStoreTransaction(STORE_NAME, 'readwrite', store => store.put(storedAttachment))
  return storedAttachment
}

export const getLotteryAttachment = async (id: string): Promise<LotteryAttachment | null> => {
  try {
    const result = await runObjectStoreTransaction(STORE_NAME, 'readonly', store => store.get(id))
    return (result as LotteryAttachment | undefined) ?? null
  } catch (e) {
    console.error(`Error loading attachment ${id}:`, e)
    return null
  }
}

export const deleteLotteryAttachment = async (id: string): Promise<void> => {
  try {
    await runObjectStoreTransaction(STORE_NAME, 'readwrite', store => store.delete(id))
  } catch (e) {
    console.error(`Error deleting attachment ${id}:`, e)
  }
}

export const deleteLotteryAttachments = async (ids: string[]): Promise<void> => {
  await Promise.all(ids.map(id => deleteLotteryAttachment(id)))
}
