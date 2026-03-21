import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import TeamWaterSVG from '@/components/dashboard/TeamWaterSVG'

type Props = {
  teamTotal: number
  memberCount: number
  teamGoal: number
}

export default function TeamProgressCard({ teamTotal, memberCount, teamGoal }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Progress</CardTitle>
        <CardDescription>
          {memberCount} {memberCount === 1 ? 'member' : 'members'} · goal: {teamGoal} oz
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TeamWaterSVG teamTotal={teamTotal} teamGoal={teamGoal} />
      </CardContent>
    </Card>
  )
}
