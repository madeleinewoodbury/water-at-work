import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ThemeToggle } from './ThemeToggle'
import UserMenu from './UserMenu'
import BrandLogo from './BrandLogo'
import NotificationBell from './NotificationBell'

const navLinkClass =
  'inline-flex h-7 cursor-pointer items-center justify-center rounded-lg px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted'

const navPrimaryClass =
  'inline-flex h-7 cursor-pointer items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85'

export default async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let displayName: string | null = null
  let email = ''
  let avatarUrl: string | null = null
  let initialNotifications: { id: string; type: string; message: string; link: string | null; is_read: boolean; created_at: string }[] = []

  if (user) {
    const [{ data: profile }, { data: notifs }] = await Promise.all([
      supabase
        .from('users')
        .select('display_name, email, avatar_url')
        .eq('id', user.id)
        .single(),
      supabase
        .from('notifications')
        .select('id, type, message, link, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])
    displayName = profile?.display_name ?? null
    email = profile?.email ?? user.email ?? ''
    avatarUrl = profile?.avatar_url ?? null
    initialNotifications = notifs ?? []
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between px-6">
        <Link
          href={user ? '/dashboard' : '/'}
          className="flex cursor-pointer items-center gap-1.5 text-base font-bold tracking-tight text-foreground"
        >
          <BrandLogo variant="nav" />
        </Link>

        <div className="flex items-center gap-1">
          {user ? (
            <>
              <Link href="/dashboard" className={navLinkClass}>
                Dashboard
              </Link>
              <Link href="/history" className={navLinkClass}>
                History
              </Link>
              <Link href="/teams" className={navLinkClass}>
                Teams
              </Link>
              <NotificationBell
                userId={user.id}
                initialNotifications={initialNotifications}
              />
              <UserMenu
                displayName={displayName}
                email={email}
                avatarUrl={avatarUrl}
              />
            </>
          ) : (
            <>
              <Link href="/sign-in" className={navLinkClass}>
                Sign In
              </Link>
              <Link href="/sign-up" className={navPrimaryClass}>
                Sign Up
              </Link>
              <ThemeToggle />
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
