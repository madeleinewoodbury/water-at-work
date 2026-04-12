import { Card, CardContent } from '@/components/ui/card'
import { formatWaterAmount } from '@/lib/utils'

type TeamDay = {
  date: string
  participantCount: number
  totalMemberCount: number
  teamTotal: number
  teamGoal: number
  metGoal: boolean
  members: { id: string; name: string; ounces: number; formerMember?: boolean }[]
}

type Props = { teamDays: TeamDay[] }

export default function TeamHistorySummary({ teamDays }: Props) {
  const totalOunces = teamDays.reduce((s, d) => s + d.teamTotal, 0)
  const daysMetGoal = teamDays.filter((d) => d.metGoal).length
  const avgOzPerDay = teamDays.length > 0 ? Math.round(totalOunces / teamDays.length) : 0
  const avgParticipation =
    teamDays.length > 0
      ? Math.round(teamDays.reduce((s, d) => s + d.participantCount, 0) / teamDays.length)
      : 0
  const totalMemberCount = teamDays[0]?.totalMemberCount ?? 0

  return (
    <Card size="sm">
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Total team" value={formatWaterAmount(totalOunces)} />
          <Stat label="Days goal met" value={String(daysMetGoal)} />
          <Stat
            label="Avg participation"
            value={`${avgParticipation} of ${totalMemberCount}`}
          />
          <Stat label="Avg team/day" value={formatWaterAmount(avgOzPerDay)} />
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  )
}
