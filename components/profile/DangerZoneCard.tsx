'use client'

import { useState, useTransition } from 'react'
import { deleteAccount } from '@/app/profile/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DangerZoneCard() {
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (confirmation !== 'DELETE') return
    const formData = new FormData()
    formData.set('confirmation', confirmation)
    startTransition(async () => {
      const result = await deleteAccount(null, formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>Irreversible account actions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Delete Account</p>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all water intake history. This action cannot be undone.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="delete-confirm" className="text-sm text-muted-foreground">
            Type <span className="font-mono font-semibold text-foreground">DELETE</span> to confirm
          </label>
          <input
            id="delete-confirm"
            type="text"
            value={confirmation}
            onChange={(e) => { setConfirmation(e.target.value); setError(null) }}
            placeholder="DELETE"
            className="block w-full rounded-md border border-border bg-background px-3 mt-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-destructive"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          onClick={handleDelete}
          disabled={confirmation !== 'DELETE' || isPending}
          className="cursor-pointer rounded-md border border-destructive/50 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? 'Deleting…' : 'Delete Account'}
        </button>
      </CardContent>
    </Card>
  )
}
