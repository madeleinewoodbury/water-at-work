'use client'

import { useEffect } from 'react'
import Image from 'next/image'

const WOW_GIFS = ['/wow/wow-1-optimized.gif', '/wow/wow-2-optimized.gif', '/wow/wow-3-optimized.gif', '/wow/wow-4-optimized.gif', '/wow/wow-5-optimized.gif']

export type WowEvent = {
  id: string
  userName: string
  ounces: number
  gif: string
}

export function pickRandomGif() {
  return WOW_GIFS[Math.floor(Math.random() * WOW_GIFS.length)]
}

type Props = {
  current: WowEvent | null
  onDismiss: () => void
}

export default function WowOverlay({ current, onDismiss }: Props) {
  // Auto-dismiss after 3.5 seconds
  useEffect(() => {
    if (!current) return
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [current, onDismiss])

  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center animate-in fade-in duration-300"
      onClick={onDismiss}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative flex flex-col items-center gap-3 rounded-2xl bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
        <Image
          src={current.gif}
          alt="Owen Wilson saying Wow"
          width={380}
          height={280}
          className="rounded-xl"
          unoptimized
        />
        <p className="text-center text-sm font-medium text-foreground">
          {current.userName} just logged {current.ounces} oz!
        </p>
        <p className="text-xs text-muted-foreground">Wow.</p>
      </div>
    </div>
  )
}
