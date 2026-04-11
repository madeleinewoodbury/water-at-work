'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteTeam, leaveTeam } from '@/app/teams/actions'

type Props = {
  teamName: string
  isMember?: boolean
  isSoleMember?: boolean
}

export default function TeamDangerZone({ teamName, isMember, isSoleMember }: Props) {
  const [isPending, startTransition] = useTransition()
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    if (confirmation !== 'DELETE') return
    const formData = new FormData()
    formData.set('confirmation', confirmation)
    startTransition(async () => {
      const result = await deleteTeam(null, formData)
      if (result?.error) setError(result.error)
    })
  }

  function handleLeave() {
    if (!confirm('Are you sure you want to leave this team?')) {
      return
    }
    startTransition(async () => {
      await leaveTeam()
    })
  }

  return (
    <Card className="ring-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">
          {isMember ? 'Leave Team' : 'Danger Zone'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isMember ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              You will lose access to team features and history.
            </p>
            <button
              type="button"
              onClick={handleLeave}
              disabled={isPending}
              className="shrink-0 cursor-pointer rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
            >
              {isPending ? 'Leaving...' : 'Leave Team'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {!isSoleMember && (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Leave Team</p>
                  <p className="text-xs text-muted-foreground">
                    Admin role will be passed to the oldest member.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLeave}
                  disabled={isPending}
                  className="shrink-0 cursor-pointer rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
                >
                  {isPending ? 'Leaving...' : 'Leave Team'}
                </button>
              </div>
            )}
            <div className={isSoleMember ? '' : 'border-t border-border pt-4'}>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Delete Team</p>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete <span className="font-medium text-foreground">{teamName}</span>. This action cannot be undone. All members will be removed.
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="delete-team-confirm" className="text-sm text-muted-foreground">
                    Type <span className="font-mono font-semibold text-foreground">DELETE</span> to confirm
                  </label>
                  <input
                    id="delete-team-confirm"
                    type="text"
                    value={confirmation}
                    onChange={(e) => { setConfirmation(e.target.value); setError(null) }}
                    placeholder="DELETE"
                    className="block w-full rounded-md border border-border bg-background px-3 py-1.5 mt-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-destructive"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={confirmation !== 'DELETE' || isPending}
                  className="cursor-pointer rounded-md border border-destructive/50 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isPending ? 'Deleting...' : 'Delete Team'}
                </button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
