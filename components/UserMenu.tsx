'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { PreviewCard } from '@base-ui/react/preview-card'
import { useTheme } from 'next-themes'
import { User, LogOut, Sun, Moon } from 'lucide-react'
import { signOut } from '@/app/auth/actions'
import AvatarDisplay from './AvatarDisplay'

type Props = {
  displayName: string | null
  email: string
  avatarUrl: string | null
}

export default function UserMenu({ displayName, email, avatarUrl }: Props) {
  const [isPending, startTransition] = useTransition()
  const { theme, setTheme } = useTheme()

  function handleSignOut() {
    startTransition(async () => {
      await signOut()
    })
  }

  const name = displayName || email.split('@')[0]

  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        render={<Link href="/profile" />}
        delay={100}
        closeDelay={200}
        className="size-8 overflow-hidden rounded-full transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label="User profile"
      >
        <AvatarDisplay avatarUrl={avatarUrl} email={email} size={32} />
      </PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner side="bottom" align="end" sideOffset={12} className="z-50">
          <PreviewCard.Popup className="min-w-[200px] rounded-xl border border-border bg-popover p-1 shadow-lg shadow-black/10">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground">{name}</div>
            <div className="my-1 h-px bg-border" />
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-foreground">Theme</span>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="relative flex size-7 cursor-pointer items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
                aria-label="Toggle theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </button>
            </div>
            <Link
              href="/profile"
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none transition-colors hover:bg-muted"
            >
              <User className="size-4" />
              Profile
            </Link>
            <button
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none transition-colors hover:bg-muted disabled:opacity-50"
              disabled={isPending}
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              {isPending ? 'Logging out…' : 'Log out'}
            </button>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  )
}
