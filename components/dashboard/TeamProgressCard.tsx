import Link from 'next/link'
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
  teamName: string | null
  teamSlug: string | null
}

export default function TeamProgressCard({
  teamTotal,
  teamStatus,
  participantCount,
  totalMemberCount,
  teamGoal,
  teamName,
  teamSlug,
}: Props) {
  const allParticipating = participantCount === totalMemberCount
  const description = allParticipating
    ? `${participantCount} ${participantCount === 1 ? 'member' : 'members'} · goal: ${teamGoal}oz`
    : `${participantCount} of ${totalMemberCount} participating · goal: ${teamGoal}oz`

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          {teamName && teamSlug ? (
            <CardTitle>
              <Link
                href={`/teams/${teamSlug}`}
                className="hover:underline"
              >
                {teamName}
              </Link>
            </CardTitle>
          ) : (
            <CardTitle>Team Progress</CardTitle>
          )}
          <p className={cn('text-xs font-normal', teamStatus.colorClass)}>
            {teamStatus.emoji} {teamStatus.label}
          </p>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <TeamWaterSVG teamTotal={teamTotal} teamGoal={teamGoal} />
      </CardContent>
    </Card>
  )
}
