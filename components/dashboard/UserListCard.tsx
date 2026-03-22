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
  avatarUrl: string | null
  email: string
  isOptedOut: boolean
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
                  isCurrentUser && !user.isOptedOut && 'font-medium text-primary',
                  user.isOptedOut && 'opacity-50'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-7 shrink-0 overflow-hidden rounded-full">
                    <AvatarDisplay avatarUrl={user.avatarUrl} email={user.email} size={28} />
                  </div>
                  <span className="flex items-center gap-1.5">
                    {user.displayName}
                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground font-normal">
                        (you)
                      </span>
                    )}
                    {user.isOptedOut && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-normal">
                        sitting out
                      </span>
                    )}
                  </span>
                </div>
                <span className="tabular-nums text-sm">
                  {!user.isOptedOut && user.ounces > 0 ? `${user.ounces} oz` : '—'}
                </span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
