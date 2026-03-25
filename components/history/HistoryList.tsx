'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import HistoryDay from './HistoryDay'
import { Button } from '@/components/ui/button'

type DayData = {
  date: string
  total: number
  entries: { ounces: number; created_at: string }[]
  effectiveGoal: number
}

type Props = {
  days: DayData[]
}

const PAGE_SIZE = 10

export default function HistoryList({ days }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentPage = Math.max(1, Number(searchParams.get('page')) || 1)
  const totalPages = Math.max(1, Math.ceil(days.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  const start = (safePage - 1) * PAGE_SIZE
  const pageDays = days.slice(start, start + PAGE_SIZE)

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (page <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(page))
    }
    router.push(`/history?${params.toString()}`)
  }

  if (days.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No intake logged for this period.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {pageDays.map((day) => (
          <HistoryDay
            key={day.date}
            date={day.date}
            total={day.total}
            dailyGoal={day.effectiveGoal}
            entries={day.entries}
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
