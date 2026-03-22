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
                <div className="flex items-center gap-2.5">
                  <div className="size-7 shrink-0 overflow-hidden rounded-full">
                    <AvatarDisplay avatarUrl={user.avatarUrl} email={user.email} size={28} />
                  </div>
                  <span>
                    {user.displayName}
                    {isCurrentUser && (
                      <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                        (you)
                      </span>
                    )}
                  </span>
                </div>
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
