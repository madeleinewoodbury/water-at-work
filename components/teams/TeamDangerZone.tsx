'use client'

import { useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteTeam, leaveTeam } from '@/app/teams/actions'

type Props = {
  teamName: string
  isMember?: boolean
}

export default function TeamDangerZone({ teamName, isMember }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${teamName}"? All members will be removed.`)) {
      return
    }
    startTransition(async () => {
      await deleteTeam()
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
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Delete Team</p>
                  <p className="text-xs text-muted-foreground">
                    This action cannot be undone. All members will be removed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="shrink-0 cursor-pointer rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
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
