'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { formatOneDecimal } from '@/lib/utils'

type Entry = {
  ounces: number
  created_at: string
}

type Props = {
  date: string
  total: number
  dailyGoal: number
  entries: Entry[]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr + 'T00:00:00').getDay()
  return day === 0 || day === 6
}

export default function HistoryDay({ date, total, dailyGoal, entries }: Props) {
  const [expanded, setExpanded] = useState(false)
  const metGoal = total >= dailyGoal
  const percent = Math.min(100, Math.round((total / dailyGoal) * 100))
  const weekend = isWeekend(date)

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        {expanded ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="flex items-center gap-1.5 min-w-[130px] text-sm font-medium">
          {formatDate(date)}
          {weekend && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-normal">
              wknd
            </span>
          )}
        </span>
        <div className="flex flex-1 items-center gap-3">
          <div className="h-2 flex-1 rounded-full bg-muted">
            <div
              className={`h-2 rounded-full transition-all ${metGoal ? 'bg-primary' : 'bg-primary/40'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="min-w-[90px] text-right text-sm tabular-nums">
            <span className={`font-semibold ${metGoal ? 'text-primary' : ''}`}>
              {formatOneDecimal(total)}
            </span>
            <span className="text-muted-foreground"> / {formatOneDecimal(dailyGoal)} oz</span>
          </span>
        </div>
      </button>

      {expanded && entries.length > 0 && (
        <div className="border-t border-border px-4 py-2">
          <ul className="space-y-1">
            {entries.map((entry, i) => (
              <li
                key={i}
                className="flex items-center justify-between py-1 text-sm text-muted-foreground"
              >
                <span>{formatOneDecimal(entry.ounces)} oz</span>
                <span>{formatTime(entry.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
