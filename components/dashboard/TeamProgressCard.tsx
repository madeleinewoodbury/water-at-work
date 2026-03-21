import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type Props = {
  teamTotal: number
  memberCount: number
}

export default function TeamProgressCard({ teamTotal, memberCount }: Props) {
  const goal = memberCount * 64

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Progress</CardTitle>
        <CardDescription>
          {memberCount} {memberCount === 1 ? 'member' : 'members'} · goal: {goal} oz
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold tabular-nums text-primary">
          {teamTotal} oz
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          combined today
        </p>
      </CardContent>
    </Card>
  )
}
