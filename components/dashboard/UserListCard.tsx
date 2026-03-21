import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type User = {
  id: string
  displayName: string
  ounces: number
}

type Props = {
  users: User[]
  currentUserId: string
}

export default function UserListCard({ users, currentUserId }: Props) {
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
            return (
              <li
                key={user.id}
                className={cn(
                  'flex items-center justify-between py-2.5',
                  isCurrentUser && 'font-medium text-primary'
                )}
              >
                <span>
                  {user.displayName}
                  {isCurrentUser && (
                    <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                      (you)
                    </span>
                  )}
                </span>
                {/* Placeholder slot for future WaterBottleSVG */}
                <span className="tabular-nums text-sm">
                  {user.ounces > 0 ? `${user.ounces} oz` : '—'}
                </span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
