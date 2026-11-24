export interface ShareAppOptions {
  title?: string
  text?: string
  url?: string
}

export type ShareAppOutcome = 'shared' | 'copied' | 'cancelled' | 'failed'

export const DEFAULT_GITHUB_PAGES_URL = 'https://redneck-vibecoding.github.io/Loterias-PWA/'

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]'])

/**
 * Builds the canonical root application URL using the configured baseURL
 * and current window origin, falling back to fallbackUrl on local dev origins.
 */
export function getAppShareUrl(baseURL = '/', fallbackUrl?: string): string {
  if (typeof window === 'undefined') return fallbackUrl || baseURL

  try {
    const origin = window.location.origin
    if (!origin) return fallbackUrl || baseURL

    const resolved = new URL(baseURL, origin)
    if (fallbackUrl && LOCAL_HOSTNAMES.has(resolved.hostname)) {
      return fallbackUrl
    }

    return resolved.href
  } catch {
    return window.location.origin ? `${window.location.origin}${baseURL}` : (fallbackUrl || baseURL)
  }
}

/**
 * Shares the application URL using the Web Share API when supported,
 * falling back to copying to the system clipboard.
 */
export async function shareApp(options: ShareAppOptions): Promise<ShareAppOutcome> {
  const url = options.url || (typeof window !== 'undefined' ? window.location.origin : '')
  const title = options.title || 'LotoControl PWA'
  const text = options.text

  const shareData: ShareData = {
    title,
    ...(text ? { text } : {}),
    url
  }

  // 1. Try Web Share API if supported
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    let canShare = true
    if (typeof navigator.canShare === 'function') {
      try {
        canShare = navigator.canShare(shareData)
      } catch {
        canShare = false
      }
    }

    if (canShare) {
      try {
        await navigator.share(shareData)
        return 'shared'
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === 'AbortError') {
          return 'cancelled'
        }
        // Fall through to clipboard if Web Share threw another error
      }
    }
  }

  // 2. Fallback to Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(url)
      return 'copied'
    } catch {
      // Clipboard write failed or was denied
    }
  }

  return 'failed'
}
