import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './SignOutButton'

export default async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <Link
        href="/"
        className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight"
      >
        WaW
      </Link>

      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Link
              href="/dashboard"
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              Dashboard
            </Link>
            <SignOutButton />
          </>
        ) : (
          <>
            <Link
              href="/sign-in"
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-md px-4 py-2 text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
