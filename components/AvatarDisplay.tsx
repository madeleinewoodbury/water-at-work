'use client'

import {
  Droplets, Waves, Fish, Shell, Sun, Leaf, Mountain, CloudRain,
  Snowflake, Flame, Wind, Star, Heart, Globe, Flower2, Moon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getIconPreset } from '@/lib/avatar-presets'
import { resolveAvatarUrl } from '@/lib/gravatar'
import AvatarImage from './AvatarImage'

const ICON_MAP: Record<string, LucideIcon> = {
  Droplets, Waves, Fish, Shell, Sun, Leaf, Mountain, CloudRain,
  Snowflake, Flame, Wind, Star, Heart, Globe, Flower2, Moon,
}

type Props = {
  avatarUrl: string | null
  email?: string
  fallbackText?: string
  size?: number
}

export default function AvatarDisplay({ avatarUrl, email, fallbackText, size = 32 }: Props) {
  if (avatarUrl?.startsWith('icon:')) {
    const preset = getIconPreset(avatarUrl.slice(5))
    if (preset) {
      const Icon = ICON_MAP[preset.iconName]
      return (
        <div
          className={cn('flex size-full items-center justify-center rounded-full', preset.bg)}
        >
          {Icon && <Icon className={cn('size-[55%]', preset.fg)} />}
        </div>
      )
    }
  }

  const resolved = resolveAvatarUrl(avatarUrl, email)
  const fallbackSource = fallbackText?.trim() || email?.split('@')[0] || '?'
  const initials = fallbackSource.charAt(0).toUpperCase()

  return (
    <div
      className="flex size-full items-center justify-center rounded-full bg-primary font-medium text-primary-foreground"
      style={{ fontSize: Math.round(size * 0.4) }}
    >
      <AvatarImage src={resolved} fallback={initials} size={size} />
    </div>
  )
}
