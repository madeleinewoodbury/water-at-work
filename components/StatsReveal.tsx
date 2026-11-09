'use client'

import { useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

// Hides its children behind a button until clicked. The revealed card can be closed again.
export default function StatsReveal({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  if (!revealed) {
    return (
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setRevealed(true)
          // Move focus to the revealed stats so keyboard and screen reader users land on them.
          requestAnimationFrame(() => panelRef.current?.focus())
        }}
        className="group mt-10 inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-background px-5 text-sm font-medium text-primary transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        See how much we drank
        <ChevronDown
          className="size-4 transition-transform group-hover:translate-y-0.5"
          aria-hidden="true"
        />
      </button>
    )
  }

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      className="relative mt-10 rounded-2xl border border-primary/20 bg-primary/5 px-8 py-6 outline-none animate-in fade-in zoom-in-95 duration-500"
    >
      <button
        type="button"
        aria-label="Close stats"
        onClick={() => {
          setRevealed(false)
          requestAnimationFrame(() => buttonRef.current?.focus())
        }}
        className="absolute right-3 top-3 inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
      {children}
    </div>
  )
}
