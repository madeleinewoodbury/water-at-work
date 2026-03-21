import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ThemeToggle } from './ThemeToggle'
import SignOutButton from './SignOutButton'

const navLinkClass =
  'inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted'

const navPrimaryClass =
  'inline-flex h-7 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85'

export default async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-base font-bold tracking-tight text-foreground">
          <span className="text-primary">~</span> WaW
        </Link>

        <div className="flex items-center gap-1">
          {user ? (
            <>
              <Link href="/dashboard" className={navLinkClass}>
                Dashboard
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className={navLinkClass}>
                Sign In
              </Link>
              <Link href="/sign-up" className={navPrimaryClass}>
                Sign Up
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
