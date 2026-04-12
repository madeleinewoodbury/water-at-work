'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import TeamHistorySummary from './TeamHistorySummary'
import TeamHistoryDay from './TeamHistoryDay'
import { Button } from '@/components/ui/button'

type TeamDay = {
  date: string
  participantCount: number
  totalMemberCount: number
  teamTotal: number
  teamGoal: number
  metGoal: boolean
  members: { id: string; name: string; ounces: number; formerMember?: boolean }[]
}

type Props = { teamDays: TeamDay[] }

const PAGE_SIZE = 10

export default function TeamHistoryList({ teamDays }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentPage = Math.max(1, Number(searchParams.get('page')) || 1)
  const totalPages = Math.max(1, Math.ceil(teamDays.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  const start = (safePage - 1) * PAGE_SIZE
  const pageDays = teamDays.slice(start, start + PAGE_SIZE)

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (page <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(page))
    }
    router.push(`/history?${params.toString()}`)
  }

  if (teamDays.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No team intake logged for this period.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <TeamHistorySummary teamDays={teamDays} />
      <div className="space-y-2">
        {pageDays.map((day) => (
          <TeamHistoryDay
            key={day.date}
            date={day.date}
            participantCount={day.participantCount}
            totalMemberCount={day.totalMemberCount}
            teamTotal={day.teamTotal}
            teamGoal={day.teamGoal}
            metGoal={day.metGoal}
            members={day.members}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => goToPage(safePage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {safePage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => goToPage(safePage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
