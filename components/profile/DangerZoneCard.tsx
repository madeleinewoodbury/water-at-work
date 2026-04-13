'use client'

import { useState, useTransition } from 'react'
import { deleteAccount } from '@/app/profile/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export default function DangerZoneCard() {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (confirmation !== 'DELETE') return
    const formData = new FormData()
    formData.set('confirmation', confirmation)
    startTransition(async () => {
      const result = await deleteAccount(null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setConfirmation('')
      setError(null)
    }
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>Irreversible account actions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Delete Account</p>
            <p className="text-sm text-muted-foreground">
              Permanently deletes your account and all water intake history.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={isPending}
            className="shrink-0 cursor-pointer rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
          >
            Delete Account
          </button>
        </div>
      </CardContent>

      <ConfirmDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Delete your account?"
        description="Permanently deletes your account and all water intake history. This action cannot be undone."
        body={
          <div className="space-y-2">
            <label htmlFor="delete-account-confirm" className="block text-sm text-muted-foreground">
              Type <span className="font-mono font-semibold text-foreground">DELETE</span> to confirm
            </label>
            <input
              id="delete-account-confirm"
              type="text"
              value={confirmation}
              onChange={(e) => {
                setConfirmation(e.target.value)
                setError(null)
              }}
              placeholder="DELETE"
              autoComplete="off"
              className="block w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-destructive"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        }
        confirmLabel="Delete Account"
        pendingLabel="Deleting..."
        destructive
        isPending={isPending}
        confirmDisabled={confirmation !== 'DELETE'}
        onConfirm={handleDelete}
      />
    </Card>
  )
}
