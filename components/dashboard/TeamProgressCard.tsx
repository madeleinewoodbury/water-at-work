import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { TeamStatus } from '@/lib/team-status'
import { cn } from '@/lib/utils'
import TeamWaterSVG from '@/components/dashboard/TeamWaterSVG'

type Props = {
  teamTotal: number
  teamPercent: number
  teamStatus: TeamStatus
  participantCount: number
  totalMemberCount: number
  teamGoal: number
}

export default function TeamProgressCard({
  teamTotal,
  teamPercent,
  teamStatus,
  participantCount,
  totalMemberCount,
  teamGoal,
}: Props) {
  const allParticipating = participantCount === totalMemberCount
  const description = allParticipating
    ? `${participantCount} ${participantCount === 1 ? 'member' : 'members'} · goal: ${teamGoal} oz`
    : `${participantCount} of ${totalMemberCount} participating · goal: ${teamGoal} oz`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Progress</CardTitle>
        <CardDescription>{description}</CardDescription>
        <p className={cn('text-xs font-normal', teamStatus.colorClass)}>
          {teamStatus.emoji} {teamStatus.label} ({teamPercent}%)
        </p>
      </CardHeader>
      <CardContent>
        <TeamWaterSVG teamTotal={teamTotal} teamGoal={teamGoal} />
      </CardContent>
    </Card>
  )
}
