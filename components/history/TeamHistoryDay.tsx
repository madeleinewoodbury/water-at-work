'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Check } from 'lucide-react'
import { formatOneDecimal, formatWaterAmount } from '@/lib/utils'

type Member = { id: string; name: string; ounces: number; formerMember?: boolean }

type Props = {
  date: string
  participantCount: number
  totalMemberCount: number
  teamTotal: number
  teamGoal: number
  metGoal: boolean
  members: Member[]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr + 'T00:00:00').getDay()
  return day === 0 || day === 6
}

export default function TeamHistoryDay({
  date,
  participantCount,
  totalMemberCount,
  teamTotal,
  teamGoal,
  metGoal,
  members,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const percent = teamGoal > 0 ? Math.min(100, Math.round((teamTotal / teamGoal) * 100)) : 0
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
              {formatWaterAmount(teamTotal)}
            </span>
            <span className="text-muted-foreground"> / {formatWaterAmount(teamGoal)}</span>
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {participantCount} of {totalMemberCount}{' '}
              {totalMemberCount === 1 ? 'member' : 'members'} participating
            </span>
            {metGoal && (
              <span className="flex items-center gap-1 text-primary text-xs font-medium">
                <Check className="size-3" />
                Goal met
              </span>
            )}
          </div>
          {members.length > 0 && (
            <ul className="space-y-1">
              {members.map((m) => (
                <li
                  key={m.id}
                  className={`flex items-center justify-between text-sm ${m.formerMember ? 'text-muted-foreground/80' : ''}`}
                >
                  <span className={m.formerMember ? 'italic' : 'text-foreground'}>{m.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatOneDecimal(m.ounces)} oz
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
