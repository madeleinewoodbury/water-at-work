'use client'

import { signOut } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'

export default function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" size="sm">
        Logout
      </Button>
    </form>
  )
}
