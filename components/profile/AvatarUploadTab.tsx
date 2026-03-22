'use client'

import { useRef, useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

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

type Props = {
  isPending: boolean
  onUpload: (file: File) => void
  error: string | null
}

export default function AvatarUploadTab({ isPending, onUpload, error }: Props) {
  const [stage, setStage] = useState<'dropzone' | 'crop'>('dropzone')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  function processFile(file: File) {
    setLocalError(null)
    if (!ALLOWED_TYPES.includes(file.type)) {
      setLocalError('File must be a JPEG, PNG, GIF, or WebP image')
      return
    }
    if (file.size > MAX_SIZE) {
      setLocalError('File must be 2 MB or smaller')
      return
    }
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setStage('crop')
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleCancel() {
    if (imageSrc) URL.revokeObjectURL(imageSrc)
    setImageSrc(null)
    setLocalError(null)
    setStage('dropzone')
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleSave() {
    if (!imageSrc || !croppedAreaPixels) return
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    onUpload(file)
  }

  const displayError = localError ?? error

  if (stage === 'crop' && imageSrc) {
    return (
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
          <span className="text-xs text-muted-foreground shrink-0">Zoom</span>
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
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Uploading…' : 'Save'}
          </Button>
          <button
            onClick={handleCancel}
            className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 transition-colors',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <Upload className="size-6 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">Drop an image here</p>
          <p className="text-xs text-muted-foreground">or click to browse</p>
        </div>
        <p className="text-xs text-muted-foreground">JPEG, PNG, GIF, or WebP · max 2 MB</p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileInput}
      />
      {displayError && <p className="text-sm text-destructive">{displayError}</p>}
    </div>
  )
}
