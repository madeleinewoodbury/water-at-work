import { createHash } from 'crypto'

export function getGravatarUrl(email: string, size = 80): string {
  const hash = createHash('md5').update(email.trim().toLowerCase()).digest('hex')
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`
}

export function resolveAvatarUrl(avatarUrl: string | null, email: string): string | null {
  if (!avatarUrl) return null
  if (avatarUrl === 'gravatar') return getGravatarUrl(email)
  if (avatarUrl.startsWith('preset:')) return `/avatars/${avatarUrl.slice(7)}.svg`
  return avatarUrl
}
