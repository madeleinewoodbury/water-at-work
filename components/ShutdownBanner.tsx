import { TriangleAlert } from 'lucide-react'

// When a date is decided, set it here (e.g. 'on December 31, 2026').
// Leave as 'soon' until then.
const SHUTDOWN_WHEN = 'soon'

export default function ShutdownBanner() {
  return (
    <div
      role="alert"
      className="w-full border-b border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
    >
      <div className="mx-auto flex max-w-[1200px] items-start gap-2 px-6 py-2.5 text-sm sm:items-center">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 sm:mt-0" aria-hidden="true" />
        <p>
          <span className="font-semibold">Water at Work is being discontinued.</span>{' '}
          The app and its database will be shut down {SHUTDOWN_WHEN}, and all
          data will be permanently deleted. Thanks for staying hydrated with us!
        </p>
      </div>
    </div>
  )
}
