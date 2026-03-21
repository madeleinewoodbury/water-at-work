import { Card, CardContent } from '@/components/ui/card'

type Props = {
  totalOunces: number
  daysTracked: number
  daysMetGoal: number
  avgPerDay: number
  dailyGoal: number
}

export default function HistorySummary({
  totalOunces,
  daysTracked,
  daysMetGoal,
  avgPerDay,
  dailyGoal,
}: Props) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Total" value={`${totalOunces} oz`} />
          <Stat label="Days tracked" value={String(daysTracked)} />
          <Stat
            label={`Goal met (${dailyGoal} oz)`}
            value={String(daysMetGoal)}
          />
          <Stat label="Daily avg" value={`${avgPerDay} oz`} />
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
