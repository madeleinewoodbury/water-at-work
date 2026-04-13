'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'dismissed_teams_announcement_v1'
// Banner hard-expires after 2026-04-20 in local time.
const EXPIRY_DATE = new Date(2026, 3, 21)

export default function TeamsAnnouncementBanner() {
  // Start as dismissed to avoid a flash on hydration
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (new Date() >= EXPIRY_DATE || localStorage.getItem(STORAGE_KEY)) return

    // Defer to the next frame to avoid synchronous state updates in effects.
    const frame = window.requestAnimationFrame(() => {
      setVisible(true)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="col-span-full flex items-start gap-3 rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100">
      <div className="flex-1">
        <p className="font-medium">Teams are here!</p>
        <ul className="mt-1 space-y-0.5 text-blue-800 dark:text-blue-200">
          <li>Create or join a team to track hydration together in real time.</li>
        </ul>
        <Link
          href="/teams"
          onClick={dismiss}
          className="mt-2 inline-flex h-8 items-center justify-center rounded-md bg-blue-600 px-3 text-xs font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Go to Teams
        </Link>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="mt-0.5 shrink-0 text-blue-500 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
