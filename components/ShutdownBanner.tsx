import { headers } from 'next/headers'
import { TriangleAlert } from 'lucide-react'
import { RETIRED_HEADER } from '@/lib/retirement'

// Shown in the banner as "will be shut down <SHUTDOWN_WHEN>".
const SHUTDOWN_WHEN = 'on December 1, 2026'

export default async function ShutdownBanner() {
  // Not shown on the retired splash page.
  if ((await headers()).get(RETIRED_HEADER)) return null

  return (
    <div
      role="alert"
      className="w-full border-b border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
    >
      <div className="mx-auto max-w-[1200px] px-6 py-2.5 text-center text-sm">
        <p className="inline-flex items-center justify-center gap-2 font-semibold">
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          Water at Work is being discontinued.
        </p>
        <p className="mt-0.5">
          The app and its database will be shut down {SHUTDOWN_WHEN}, and all
          data will be permanently deleted. Thank you for staying hydrated!
        </p>
      </div>
    </div>
  )
}
