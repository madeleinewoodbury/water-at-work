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
  participantCount: number
  totalMemberCount: number
  teamGoal: number
}

export default function TeamProgressCard({ teamTotal, participantCount, totalMemberCount, teamGoal }: Props) {
  const allParticipating = participantCount === totalMemberCount
  const description = allParticipating
    ? `${participantCount} ${participantCount === 1 ? 'member' : 'members'} · goal: ${teamGoal} oz`
    : `${participantCount} of ${totalMemberCount} participating · goal: ${teamGoal} oz`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Progress</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <TeamWaterSVG teamTotal={teamTotal} teamGoal={teamGoal} />
      </CardContent>
    </Card>
  )
}
