'use client'

import { useState, useTransition } from 'react'
import {
  Droplets, Waves, Fish, Shell, Sun, Leaf, Mountain, CloudRain,
  Snowflake, Flame, Wind, Star, Heart, Globe, Flower2, Moon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateAvatar, updateDisplayName } from '@/app/profile/actions'
import { ICON_PRESETS } from '@/lib/avatar-presets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AvatarDisplay from '@/components/AvatarDisplay'
import AvatarUploadTab from '@/components/profile/AvatarUploadTab'
import { X } from 'lucide-react'

type Tab = 'gravatar' | 'presets' | 'upload'

const ICON_MAP: Record<string, LucideIcon> = {
  Droplets, Waves, Fish, Shell, Sun, Leaf, Mountain, CloudRain,
  Snowflake, Flame, Wind, Star, Heart, Globe, Flower2, Moon,
}

type Props = {
  currentAvatarUrl: string | null
  email: string
  displayName: string | null
}

export default function ProfileIdentityCard({
  currentAvatarUrl,
  email,
  displayName,
}: Props) {
  const [isChangingPhoto, setIsChangingPhoto] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('gravatar')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    currentAvatarUrl?.startsWith('icon:') ? currentAvatarUrl.slice(5) : null
  )
  const [fileError, setFileError] = useState<string | null>(null)
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const [name, setName] = useState(displayName ?? '')
  const [nameMessage, setNameMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const [isPending, startTransition] = useTransition()

  // --- Avatar handlers ---

  function handleGravatar() {
    const formData = new FormData()
    formData.set('avatar_type', 'gravatar')
    startTransition(async () => {
      const result = await updateAvatar(null, formData)
      setAvatarMessage(result?.error
        ? { type: 'error', text: result.error }
        : { type: 'success', text: result?.success ?? 'Avatar updated' }
      )
      if (!result?.error) setIsChangingPhoto(false)
    })
  }

  function handlePreset() {
    if (!selectedPreset) return
    const formData = new FormData()
    formData.set('avatar_type', 'preset')
    formData.set('avatar_url', `icon:${selectedPreset}`)
    startTransition(async () => {
      const result = await updateAvatar(null, formData)
      setAvatarMessage(result?.error
        ? { type: 'error', text: result.error }
        : { type: 'success', text: result?.success ?? 'Avatar updated' }
      )
      if (!result?.error) setIsChangingPhoto(false)
    })
  }

  function handleUpload(file: File) {
    setFileError(null)
    const formData = new FormData()
    formData.set('avatar_type', 'upload')
    formData.set('file', file)
    startTransition(async () => {
      const result = await updateAvatar(null, formData)
      setAvatarMessage(result?.error
        ? { type: 'error', text: result.error }
        : { type: 'success', text: result?.success ?? 'Avatar updated' }
      )
      if (!result?.error) setIsChangingPhoto(false)
    })
  }

  // --- Name handler ---

  function handleNameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateDisplayName(null, formData)
      setNameMessage(result?.error
        ? { type: 'error', text: result.error }
        : { type: 'success', text: result?.success ?? 'Name updated' }
      )
    })
  }

  const tabClass = (tab: Tab) =>
    `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
      activeTab === tab
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your display name and photo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Avatar row */}
        <div className="flex items-center gap-4">
          <div className="size-16 shrink-0 overflow-hidden rounded-full">
            <AvatarDisplay avatarUrl={currentAvatarUrl} email={email} size={64} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{displayName || email.split('@')[0]}</p>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </div>
          <button
            onClick={() => { setIsChangingPhoto(!isChangingPhoto); setAvatarMessage(null) }}
            className="shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Change photo
          </button>
        </div>

        {/* Collapsible avatar selection */}
        {isChangingPhoto && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Choose a photo</p>
              <button
                onClick={() => { setIsChangingPhoto(false); setAvatarMessage(null) }}
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {(['gravatar', 'presets', 'upload'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  className={tabClass(tab)}
                  onClick={() => { setActiveTab(tab); setAvatarMessage(null) }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Gravatar tab */}
            {activeTab === 'gravatar' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-full">
                    <AvatarDisplay avatarUrl="gravatar" email={email} size={48} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Uses the image from your{' '}
                    <a href="https://gravatar.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                      Gravatar
                    </a>{' '}
                    account
                  </p>
                </div>
                <Button size="sm" onClick={handleGravatar} disabled={isPending}>
                  {isPending ? 'Saving…' : 'Use Gravatar'}
                </Button>
              </div>
            )}

            {/* Presets tab */}
            {activeTab === 'presets' && (
              <div className="space-y-3">
                <div className="grid grid-cols-8 gap-2">
                  {ICON_PRESETS.map((preset) => {
                    const Icon = ICON_MAP[preset.iconName]
                    return (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedPreset(preset.id)}
                        title={preset.id.replace(/-/g, ' ')}
                        className={cn(
                          'flex size-10 items-center justify-center rounded-full ring-offset-background transition-all',
                          preset.bg,
                          selectedPreset === preset.id
                            ? 'ring-2 ring-primary ring-offset-2'
                            : 'opacity-75 hover:opacity-100'
                        )}
                      >
                        {Icon && <Icon className={cn('size-5', preset.fg)} />}
                      </button>
                    )
                  })}
                </div>
                <Button size="sm" onClick={handlePreset} disabled={isPending || !selectedPreset}>
                  {isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            )}

            {/* Upload tab */}
            {activeTab === 'upload' && (
              <AvatarUploadTab
                isPending={isPending}
                onUpload={handleUpload}
                error={fileError}
              />
            )}

            {avatarMessage && (
              <p className={`text-sm ${avatarMessage.type === 'error' ? 'text-destructive' : 'text-success'}`}>
                {avatarMessage.text}
              </p>
            )}
          </div>
        )}

        <div className="h-px bg-border" />

        {/* Display name form */}
        <form onSubmit={handleNameSubmit} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              name="display_name"
              placeholder={email.split('@')[0]}
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
            {nameMessage && (
              <p className={`text-sm ${nameMessage.type === 'error' ? 'text-destructive' : 'text-success'}`}>
                {nameMessage.text}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
