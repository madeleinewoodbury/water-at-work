'use client'

import { useTransition } from 'react'
import { Shield } from 'lucide-react'
import { kickMember, requestToJoin, cancelRequest } from '@/app/teams/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AvatarDisplay from '@/components/AvatarDisplay'

type Member = {
  id: string
  displayName: string
  avatarUrl: string | null
  teamRole: string
  createdAt: string
}

type Props = {
  members: Member[]
  currentUserId: string
  isAdmin: boolean
  isMember: boolean
  teamId: string
  canJoin: boolean
  userPendingRequestId: string | null
}

function MemberRow({
  member,
  currentUserId,
  isAdmin,
}: {
  member: Member
  currentUserId: string
  isAdmin: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const isCurrentUser = member.id === currentUserId

  function handleKick() {
    startTransition(async () => {
      await kickMember(member.id)
    })
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 shrink-0">
          <AvatarDisplay
            avatarUrl={member.avatarUrl}
            fallbackText={member.displayName}
            size={32}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium">
              {member.displayName}
              {isCurrentUser && (
                <span className="ml-1 text-xs text-muted-foreground">(you)</span>
              )}
            </p>
            {member.teamRole === 'admin' && (
              <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
            )}
          </div>
        </div>
      </div>

      {isAdmin && !isCurrentUser && (
        <button
          type="button"
          onClick={handleKick}
          disabled={isPending}
          className="shrink-0 cursor-pointer rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
        >
          {isPending ? 'Removing...' : 'Remove'}
        </button>
      )}
    </div>
  )
}

export default function MemberList({
  members,
  currentUserId,
  isAdmin,
  isMember: _isMember,
  teamId,
  canJoin,
  userPendingRequestId,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const isOnTeam = isAdmin || _isMember

  function handleJoin() {
    startTransition(async () => {
      await requestToJoin(teamId)
    })
  }

  function handleCancel() {
    if (!userPendingRequestId) return
    startTransition(async () => {
      await cancelRequest(userPendingRequestId)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members ({members.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          ))}
        </div>

        {!isOnTeam && (
          <div className="mt-4 border-t border-border pt-4">
            {userPendingRequestId ? (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="w-full cursor-pointer rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                {isPending ? 'Cancelling...' : 'Cancel Pending Request'}
              </button>
            ) : canJoin ? (
              <button
                type="button"
                onClick={handleJoin}
                disabled={isPending}
                className="w-full cursor-pointer rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-50"
              >
                {isPending ? 'Requesting...' : 'Request to Join'}
              </button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
