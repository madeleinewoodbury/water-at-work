import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
        Stay hydrated at work.
      </h1>
      <p className="mt-6 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        WaW helps you track your daily water intake and build healthy habits — one glass at a time.
      </p>
      <div className="mt-10 flex gap-4">
        <Link
          href="/sign-up"
          className="rounded-md px-6 py-3 text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
        >
          Get started
        </Link>
        <Link
          href="/sign-in"
          className="rounded-md px-6 py-3 text-sm font-semibold text-zinc-700 border border-zinc-300 hover:bg-zinc-50 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-900 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </main>
  )
}
