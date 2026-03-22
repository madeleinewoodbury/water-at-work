'use client'

import { useRef, useState, useTransition } from 'react'
import { updateAvatar } from '@/app/profile/actions'
import { updateDisplayName } from '@/app/profile/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AvatarImage from '@/components/AvatarImage'
import { X } from 'lucide-react'

type Tab = 'gravatar' | 'presets' | 'upload'

const PRESETS = [
  { id: 'wave', label: 'Wave' },
  { id: 'droplet', label: 'Droplet' },
  { id: 'fish', label: 'Fish' },
  { id: 'coral', label: 'Coral' },
  { id: 'sun', label: 'Sun' },
  { id: 'mountain', label: 'Mountain' },
  { id: 'shell', label: 'Shell' },
  { id: 'leaf', label: 'Leaf' },
]

type Props = {
  currentAvatarUrl: string | null
  email: string
  displayName: string | null
  gravatarUrl: string
  resolvedAvatarUrl: string | null
}

function getInitials(displayName: string | null, email: string): string {
  const name = displayName || email.split('@')[0]
  return name.charAt(0).toUpperCase()
}

export default function ProfileIdentityCard({
  currentAvatarUrl,
  email,
  displayName,
  gravatarUrl,
  resolvedAvatarUrl,
}: Props) {
  const [isChangingPhoto, setIsChangingPhoto] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('gravatar')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    currentAvatarUrl?.startsWith('preset:') ? currentAvatarUrl.slice(7) : null
  )
  const [fileError, setFileError] = useState<string | null>(null)
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const [name, setName] = useState(displayName ?? '')
  const [nameMessage, setNameMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const initials = getInitials(displayName, email)

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
    formData.set('avatar_url', `preset:${selectedPreset}`)
    startTransition(async () => {
      const result = await updateAvatar(null, formData)
      setAvatarMessage(result?.error
        ? { type: 'error', text: result.error }
        : { type: 'success', text: result?.success ?? 'Avatar updated' }
      )
      if (!result?.error) setIsChangingPhoto(false)
    })
  }

  function handleUpload() {
    setFileError(null)
    const file = fileRef.current?.files?.[0]
    if (!file) { setFileError('Please select a file'); return }
    if (file.size > 2 * 1024 * 1024) { setFileError('File must be 2 MB or smaller'); return }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowed.includes(file.type)) { setFileError('File must be a JPEG, PNG, GIF, or WebP image'); return }
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
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-medium text-primary-foreground">
            <AvatarImage src={resolvedAvatarUrl} fallback={initials} size={64} />
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
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-medium text-primary-foreground">
                    <AvatarImage src={gravatarUrl} fallback={initials} size={48} />
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
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.id)}
                      title={preset.label}
                      className={`flex size-10 items-center justify-center overflow-hidden rounded-full ring-offset-background transition-all ${
                        selectedPreset === preset.id
                          ? 'ring-2 ring-primary ring-offset-2'
                          : 'opacity-75 hover:opacity-100'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/avatars/${preset.id}.svg`} alt={preset.label} className="size-full" />
                    </button>
                  ))}
                </div>
                <Button size="sm" onClick={handlePreset} disabled={isPending || !selectedPreset}>
                  {isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            )}

            {/* Upload tab */}
            {activeTab === 'upload' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted"
                    onChange={() => setFileError(null)}
                  />
                  <p className="text-xs text-muted-foreground">JPEG, PNG, GIF, or WebP · max 2 MB</p>
                  {fileError && <p className="text-sm text-destructive">{fileError}</p>}
                </div>
                <Button size="sm" onClick={handleUpload} disabled={isPending}>
                  {isPending ? 'Uploading…' : 'Upload'}
                </Button>
              </div>
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
