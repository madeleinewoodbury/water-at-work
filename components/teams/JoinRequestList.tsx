'use client'

import { useTransition } from 'react'
import { approveRequest, rejectRequest } from '@/app/teams/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AvatarDisplay from '@/components/AvatarDisplay'

type Request = {
  id: string
  displayName: string
  avatarUrl: string | null
  createdAt: string
}

type Props = {
  requests: Request[]
}

function RequestRow({ request }: { request: Request }) {
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    startTransition(async () => {
      await approveRequest(request.id)
    })
  }

  function handleReject() {
    startTransition(async () => {
      await rejectRequest(request.id)
    })
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 shrink-0">
          <AvatarDisplay
            avatarUrl={request.avatarUrl}
            fallbackText={request.displayName}
            size={32}
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{request.displayName}</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending}
          className="cursor-pointer rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          className="cursor-pointer rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  )
}

export default function JoinRequestList({ requests }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Requests ({requests.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {requests.map((req) => (
            <RequestRow key={req.id} request={req} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
