import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import AvatarDisplay from '@/components/AvatarDisplay'

type User = {
  id: string
  displayName: string
  ounces: number
  dailyGoal: number
  avatarUrl: string | null
  email: string
  isOptedOut: boolean
}

type Props = {
  users: User[]
  currentUserId: string
}

const WORKDAY_START = 9
const WORKDAY_HOURS = 8

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

  if (ounces >= dailyGoal && ounces > aheadTarget)
    return { emoji: '🌊', label: 'flooded!', colorClass: 'text-orange-700 dark:text-orange-400' }
  if (ounces >= dailyGoal)
    return { emoji: '🏆', label: 'crushed it!', colorClass: 'text-green-700 dark:text-green-400' }
  if (ounces > aheadTarget)
    return { emoji: '🚿', label: 'too fast', colorClass: 'text-violet-700 dark:text-violet-400' }
  if (ounces >= target)
    return { emoji: '💧', label: 'on track', colorClass: 'text-sky-700 dark:text-sky-400' }
  if (target > 0 && ounces >= target * 0.5)
    return { emoji: '🐢', label: 'behind', colorClass: 'text-amber-700 dark:text-amber-400' }
  return { emoji: '💤', label: 'slacking', colorClass: 'text-muted-foreground' }
}

export default function UserListCard({ users, currentUserId }: Props) {
  const completedHours = getCompletedHours(new Date())

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
                        sitting out
                      </span>
                    )}
                  </span>
                </div>

                {!user.isOptedOut && (
                  <span className={cn('shrink-0 text-xs font-normal', status.colorClass)}>
                    {status.emoji} {status.label}
                  </span>
                )}

                <span className="shrink-0 tabular-nums text-sm">
                  {user.isOptedOut ? '—' : `${user.ounces} / ${user.dailyGoal} oz`}
                </span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
