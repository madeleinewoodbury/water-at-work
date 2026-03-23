'use client'

import { useState, useRef, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import {
  Droplets, Waves, Fish, Shell, Sun, Leaf, Mountain, CloudRain,
  Snowflake, Flame, Wind, Star, Heart, Globe, Flower2, Moon,
  Upload, X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ICON_PRESETS } from '@/lib/avatar-presets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completeOnboarding } from '@/app/onboarding/actions'

const ICON_MAP: Record<string, LucideIcon> = {
  Droplets, Waves, Fish, Shell, Sun, Leaf, Mountain, CloudRain,
  Snowflake, Flame, Wind, Star, Heart, Globe, Flower2, Moon,
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024

async function getCroppedImg(src: string, pixelCrop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = src
  })

  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 400
  const ctx = canvas.getContext('2d')!

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    400,
    400
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas toBlob failed'))
    }, 'image/jpeg', 0.9)
  })
}

export default function OnboardingForm({
  githubAvatarUrl,
  gravatarUrl,
  error,
}: {
  githubAvatarUrl?: string | null
  gravatarUrl?: string | null
  error?: string | null
}) {
  const [selected, setSelected] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [gravatarLoaded, setGravatarLoaded] = useState(false)
  const croppedFileRef = useRef<File | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload/crop state
  const [uploadStage, setUploadStage] = useState<'idle' | 'crop' | 'done'>('idle')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  function processFile(file: File) {
    setUploadError(null)
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('File must be a JPEG, PNG, GIF, or WebP image')
      return
    }
    if (file.size > MAX_SIZE) {
      setUploadError('File must be 2 MB or smaller')
      return
    }
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setUploadStage('crop')
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleCropSave() {
    if (!imageSrc || !croppedAreaPixels) return
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    croppedFileRef.current = file

    const previewUrl = URL.createObjectURL(blob)
    setUploadPreview(previewUrl)
    setSelected('upload')
    setUploadStage('done')

    if (imageSrc) URL.revokeObjectURL(imageSrc)
    setImageSrc(null)
  }

  function handleCropCancel() {
    if (imageSrc) URL.revokeObjectURL(imageSrc)
    setImageSrc(null)
    setUploadStage('idle')
  }

  function clearUpload() {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview)
    setUploadPreview(null)
    croppedFileRef.current = null
    setUploadStage('idle')
    if (selected === 'upload') setSelected('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)

    const formData = new FormData(e.currentTarget)

    if (selected === 'upload' && croppedFileRef.current) {
      formData.set('avatar_url', '')
      formData.append('file', croppedFileRef.current)
    }

    await completeOnboarding(formData)
    setSubmitting(false)
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="display_name">Your name</Label>
        <Input
          id="display_name"
          name="display_name"
          type="text"
          required
          maxLength={50}
          autoComplete="nickname"
          placeholder="What should your teammates call you?"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="daily_goal">Daily water goal (oz)</Label>
        <Input
          id="daily_goal"
          name="daily_goal"
          type="number"
          required
          min={1}
          defaultValue={32}
        />
        <p className="text-xs text-muted-foreground">
          Default is 32 oz — adjust to match your goal.
        </p>
      </div>

      {/* Avatar picker */}
      <div className="flex flex-col gap-1.5">
        <Label>
          Choose an avatar{' '}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <input type="hidden" name="avatar_url" value={selected === 'upload' ? '' : selected} />

        {uploadStage === 'crop' && imageSrc ? (
          <div className="space-y-3">
            <div className="relative h-56 overflow-hidden rounded-lg bg-muted">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs text-muted-foreground">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" size="sm" onClick={handleCropSave}>
                Use this photo
              </Button>
              <button
                type="button"
                onClick={handleCropCancel}
                className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-1.5">
            {/* GitHub avatar */}
            {githubAvatarUrl && (
              <button
                type="button"
                onClick={() =>
                  setSelected(selected === githubAvatarUrl ? '' : githubAvatarUrl)
                }
                className={cn(
                  'flex cursor-pointer items-center justify-center overflow-hidden rounded-full aspect-square ring-offset-background transition-shadow',
                  selected === githubAvatarUrl
                    ? 'ring-2 ring-ring ring-offset-2'
                    : 'hover:ring-2 hover:ring-muted-foreground/40 hover:ring-offset-1'
                )}
              >
                <img
                  src={githubAvatarUrl}
                  alt="GitHub avatar"
                  className="size-full object-cover"
                />
              </button>
            )}

            {/* Gravatar */}
            {gravatarUrl && (
              <button
                type="button"
                onClick={() =>
                  setSelected(selected === 'gravatar' ? '' : 'gravatar')
                }
                className={cn(
                  'flex cursor-pointer items-center justify-center overflow-hidden rounded-full aspect-square ring-offset-background transition-shadow',
                  !gravatarLoaded && 'hidden',
                  selected === 'gravatar'
                    ? 'ring-2 ring-ring ring-offset-2'
                    : 'hover:ring-2 hover:ring-muted-foreground/40 hover:ring-offset-1'
                )}
              >
                <img
                  src={gravatarUrl}
                  alt="Gravatar"
                  className="size-full object-cover"
                  onLoad={() => setGravatarLoaded(true)}
                  onError={() => setGravatarLoaded(false)}
                />
              </button>
            )}

            {/* Uploaded photo preview */}
            {uploadPreview && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setSelected(selected === 'upload' ? '' : 'upload')
                  }
                  className={cn(
                    'flex cursor-pointer items-center justify-center overflow-hidden rounded-full aspect-square ring-offset-background transition-shadow',
                    selected === 'upload'
                      ? 'ring-2 ring-ring ring-offset-2'
                      : 'hover:ring-2 hover:ring-muted-foreground/40 hover:ring-offset-1'
                  )}
                >
                  <img
                    src={uploadPreview}
                    alt="Uploaded avatar"
                    className="size-full object-cover"
                  />
                </button>
                <button
                  type="button"
                  onClick={clearUpload}
                  className="absolute -top-1 -right-1 flex size-4 cursor-pointer items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}

            {/* Icon presets */}
            {ICON_PRESETS.map((preset) => {
              const Icon = ICON_MAP[preset.iconName]
              const value = `icon:${preset.id}`
              const isSelected = selected === value
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelected(isSelected ? '' : value)}
                  className={cn(
                    'flex cursor-pointer items-center justify-center rounded-full aspect-square ring-offset-background transition-shadow',
                    preset.bg,
                    isSelected
                      ? 'ring-2 ring-ring ring-offset-2'
                      : 'hover:ring-2 hover:ring-muted-foreground/40 hover:ring-offset-1'
                  )}
                >
                  {Icon && <Icon className={cn('size-[55%]', preset.fg)} />}
                </button>
              )
            })}

            {/* Upload button */}
            {!uploadPreview && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer items-center justify-center rounded-full aspect-square border-2 border-dashed border-border transition-colors hover:border-primary/50 hover:bg-muted/50"
              >
                <Upload className="size-[45%] text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileInput}
        />
        {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
      </div>

      <p className="text-xs text-muted-foreground">
        You can change these settings anytime from your profile.
      </p>

      <Button type="submit" className="w-full" disabled={submitting || uploadStage === 'crop'}>
        {submitting ? 'Setting up...' : 'Get started'}
      </Button>
    </form>
  )
}
