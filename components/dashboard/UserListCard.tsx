'use client'

import { useState } from 'react'
import { cn, formatOneDecimal } from '@/lib/utils'
import { UserX, Undo2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import AvatarDisplay from '@/components/AvatarDisplay'

type User = {
  id: string
  displayName: string
  ounces: number
  dailyGoal: number
  avatarUrl: string | null
  email: string
  isOptedOut: boolean
  optOutId: string | null
  optedOutBy: string | null
}

type Props = {
  users: User[]
  currentUserId: string
  isPastCutoff: boolean
  isPending: boolean
  onOptOutUser: (userId: string) => void
  onUndoOptOut: (optOutId: string) => void
}

const WORKDAY_START = 9
const WORKDAY_HOURS = 8
const ABOVE_AND_BEYOND_MULTIPLIER = 1.1
const FLOODED_OVER_GOAL_MULTIPLIER = 1.5

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

function getCompletedHours(now: Date): number {
  const hour = now.getHours()
  if (hour < WORKDAY_START) return 0
  if (hour >= WORKDAY_START + WORKDAY_HOURS) return WORKDAY_HOURS
  return hour - WORKDAY_START
}

function getHourlyTarget(dailyGoal: number, completedHours: number): number {
  return Math.floor((completedHours / WORKDAY_HOURS) * dailyGoal)
}

function getStatusIndicator(ounces: number, dailyGoal: number, completedHours: number) {
  const target = getHourlyTarget(dailyGoal, completedHours)
  const aheadTarget = getHourlyTarget(dailyGoal, Math.min(completedHours + 2, WORKDAY_HOURS))
  const normalizedOunces = roundToOneDecimal(ounces)
  const normalizedGoal = roundToOneDecimal(dailyGoal)
  const normalizedTarget = roundToOneDecimal(target)
  const normalizedAheadTarget = roundToOneDecimal(aheadTarget)
  const floodedThreshold = roundToOneDecimal(normalizedGoal * FLOODED_OVER_GOAL_MULTIPLIER)
  const aboveAndBeyondThreshold = roundToOneDecimal(normalizedGoal * ABOVE_AND_BEYOND_MULTIPLIER)

  if (normalizedGoal > 0 && normalizedOunces >= floodedThreshold)
    return { emoji: '🌊', label: 'flooded!', colorClass: 'text-orange-700 dark:text-orange-400' }
  if (normalizedGoal > 0 && normalizedOunces >= aboveAndBeyondThreshold)
    return {
      emoji: '🚀',
      label: 'above & beyond',
      colorClass: 'text-emerald-700 dark:text-emerald-400',
    }
  if (normalizedOunces >= normalizedGoal)
    return { emoji: '🏆', label: 'crushed it!', colorClass: 'text-green-700 dark:text-green-400' }
  if (normalizedOunces > normalizedAheadTarget)
    return { emoji: '🚿', label: 'too fast', colorClass: 'text-violet-700 dark:text-violet-400' }
  if (normalizedOunces >= normalizedTarget)
    return { emoji: '💧', label: 'on track', colorClass: 'text-sky-700 dark:text-sky-400' }
  if (normalizedTarget > 0 && normalizedOunces >= roundToOneDecimal(normalizedTarget * 0.5))
    return { emoji: '🐢', label: 'behind', colorClass: 'text-amber-700 dark:text-amber-400' }
  return { emoji: '💤', label: 'slacking', colorClass: 'text-muted-foreground' }
}

export default function UserListCard({
  users,
  currentUserId,
  isPastCutoff,
  isPending,
  onOptOutUser,
  onUndoOptOut,
}: Props) {
  const completedHours = getCompletedHours(new Date())
  const [optOutTarget, setOptOutTarget] = useState<{ id: string; name: string } | null>(null)

  function handleOptOut(userId: string, displayName: string) {
    setOptOutTarget({ id: userId, name: displayName })
  }

  function confirmOptOut() {
    if (!optOutTarget) return
    onOptOutUser(optOutTarget.id)
    setOptOutTarget(null)
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Team Intake</CardTitle>
        <CardDescription>Everyone&apos;s water for today</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId
            const status = getStatusIndicator(user.ounces, user.dailyGoal, completedHours)
            const isTeamOptOut = user.isOptedOut && user.optedOutBy && user.optedOutBy !== user.id
            const canSitOut = !isCurrentUser && !user.isOptedOut && user.ounces === 0 && isPastCutoff
            const canUndo = isTeamOptOut && user.optedOutBy === currentUserId && user.optOutId

            return (
              <li
                key={user.id}
                className={cn(
                  'flex items-center gap-3 py-2.5',
                  isCurrentUser && !user.isOptedOut && 'font-medium text-primary',
                  user.isOptedOut && 'opacity-50'
                )}
              >
                <div className="flex flex-1 min-w-0 items-center gap-2.5">
                  <div className="size-7 shrink-0 overflow-hidden rounded-full">
                    <AvatarDisplay avatarUrl={user.avatarUrl} email={user.email} size={28} />
                  </div>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate">{user.displayName}</span>
                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground font-normal shrink-0">
                        (you)
                      </span>
                    )}
                    {user.isOptedOut && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-normal shrink-0">
                        {isTeamOptOut ? 'sat out by teammate' : 'sitting out'}
                      </span>
                    )}
                  </span>
                </div>

                {!user.isOptedOut && (
                  <span className={cn('shrink-0 text-xs font-normal', status.colorClass)}>
                    {status.emoji} {status.label}
                  </span>
                )}

                {canUndo && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onUndoOptOut(user.optOutId!)}
                    className="shrink-0 cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50"
                    title="Undo sit out"
                  >
                    <Undo2 className="inline size-3 mr-0.5" />
                    Undo
                  </button>
                )}

                {canSitOut && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleOptOut(user.id, user.displayName)}
                    className="shrink-0 cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50"
                    title="Sit out this user for today"
                  >
                    <UserX className="inline size-3 mr-0.5" />
                    Sit out
                  </button>
                )}

                <span className="shrink-0 tabular-nums text-sm">
                  {user.isOptedOut ? '—' : `${formatOneDecimal(user.ounces)} / ${formatOneDecimal(user.dailyGoal)} oz`}
                </span>
              </li>
            )
          })}
        </ul>
      </CardContent>
      <ConfirmDialog
        open={optOutTarget !== null}
        onOpenChange={(open) => { if (!open) setOptOutTarget(null) }}
        title={optOutTarget ? `Sit out ${optOutTarget.name} for today?` : ''}
        description="They'll be excluded from today's team total until they log water or opt back in."
        confirmLabel="Sit out"
        destructive
        isPending={isPending}
        onConfirm={confirmOptOut}
      />
    </Card>
  )
}
