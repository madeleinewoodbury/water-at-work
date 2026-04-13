'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { requestToJoin, cancelRequest } from '@/app/teams/actions'

type Props = {
  team: {
    id: string
    name: string
    slug: string
    created_at: string
    memberCount: number
  }
  isUserTeam: boolean
  isPending: boolean
  pendingRequestId: string | null
  canJoin: boolean
}

export default function TeamCard({
  team,
  isUserTeam,
  isPending,
  pendingRequestId,
  canJoin,
}: Props) {
  const [isPendingTransition, startTransition] = useTransition()

  function handleJoin() {
    startTransition(async () => {
      await requestToJoin(team.id)
    })
  }

  function handleCancel() {
    if (!pendingRequestId) return
    startTransition(async () => {
      await cancelRequest(pendingRequestId)
    })
  }

  return (
    <Card
      className={`relative transition hover:ring-2 hover:ring-primary/40 ${
        isUserTeam ? 'ring-2 ring-primary' : ''
      }`}
    >
      <Link
        href={`/teams/${team.slug}`}
        aria-label={`View ${team.name}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <CardContent className="pointer-events-none relative flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="block truncate font-medium text-foreground">
              {team.name}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>
                {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
              </span>
            </div>
          </div>

          {isUserTeam && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Your team
            </span>
          )}
        </div>

        {(isPending || canJoin) && (
          <div className="pointer-events-auto relative z-10">
            {isPending ? (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPendingTransition}
                className="w-full cursor-pointer rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                {isPendingTransition ? 'Cancelling...' : 'Cancel Request'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleJoin}
                disabled={isPendingTransition}
                className="w-full cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-50"
              >
                {isPendingTransition ? 'Requesting...' : 'Request to Join'}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
