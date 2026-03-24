import { Card, CardContent } from '@/components/ui/card'
import { formatWaterAmount } from '@/lib/utils'

type Props = {
  totalOunces: number
  daysTracked: number
  daysMetGoal: number
  avgPerDay: number
}

export default function HistorySummary({
  totalOunces,
  daysTracked,
  daysMetGoal,
  avgPerDay,
}: Props) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Total" value={formatWaterAmount(totalOunces)} />
          <Stat label="Days tracked" value={String(daysTracked)} />
          <Stat label="Days goal met" value={String(daysMetGoal)} />
          <Stat label="Daily avg" value={formatWaterAmount(avgPerDay)} />
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
