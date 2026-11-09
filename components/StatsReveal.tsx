'use client'

import { useRef, useState } from 'react'

// Hides its children behind a button until clicked.
export default function StatsReveal({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => {
          setRevealed(true)
          // Move focus to the revealed stats so keyboard and screen reader users land on them.
          requestAnimationFrame(() => panelRef.current?.focus())
        }}
        className="mt-10 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        💧 See how much we drank
      </button>
    )
  }

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 px-8 py-6 outline-none animate-in fade-in zoom-in-95 duration-500"
    >
      {children}
    </div>
  )
}
