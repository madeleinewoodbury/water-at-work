'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Menu } from '@base-ui/react/menu'
import { signOut } from '@/app/auth/actions'
import { User, LogOut } from 'lucide-react'

type Props = {
  displayName: string | null
  email: string
}

function getInitials(displayName: string | null, email: string): string {
  const name = displayName || email.split('@')[0]
  return name.charAt(0).toUpperCase()
}

export default function UserMenu({ displayName, email }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(async () => {
      await signOut()
    })
  }

  const initials = getInitials(displayName, email)

  return (
    <Menu.Root>
      <Menu.Trigger
        className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label="User menu"
      >
        {initials}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="end">
          <Menu.Popup className="z-50 min-w-[160px] rounded-lg border border-border bg-popover p-1 shadow-md">
            <div className="px-3 py-2 text-xs text-muted-foreground">
              {displayName || email.split('@')[0]}
            </div>
            <Menu.LinkItem
              render={<Link href="/profile" />}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-muted"
            >
              <User className="size-4" />
              Profile
            </Menu.LinkItem>
            <Menu.Item
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-muted"
              disabled={isPending}
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              {isPending ? 'Logging out…' : 'Log out'}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
