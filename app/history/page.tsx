import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HistoryFilter from '@/components/history/HistoryFilter'
import HistorySummary from '@/components/history/HistorySummary'
import HistoryList from '@/components/history/HistoryList'

type SearchParams = Promise<{ from?: string; to?: string }>

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const params = await searchParams
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split('T')[0]
  const todayStr = today.toISOString().split('T')[0]

  const isValidDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s))
  const rawFrom = params.from && isValidDate(params.from) ? params.from : monthStart
  const rawTo = params.to && isValidDate(params.to) ? params.to : todayStr

  // Ensure from <= to; swap if reversed
  const fromDate = rawFrom <= rawTo ? rawFrom : rawTo
  const toDate = rawFrom <= rawTo ? rawTo : rawFrom

  const [{ data: logs }, { data: profile }] = await Promise.all([
    supabase
      .from('intake_logs')
      .select('date, ounces, created_at')
      .eq('user_id', user.id)
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: false })
      .order('created_at', { ascending: true }),
    supabase
      .from('users')
      .select('daily_goal')
      .eq('id', user.id)
      .single(),
  ])

  const dailyGoal = profile?.daily_goal ?? 32

  // Group logs by date
  const dayMap = new Map<
    string,
    { total: number; entries: { ounces: number; created_at: string }[] }
  >()

  for (const log of logs ?? []) {
    const existing = dayMap.get(log.date)
    if (existing) {
      existing.total += log.ounces
      existing.entries.push({ ounces: log.ounces, created_at: log.created_at })
    } else {
      dayMap.set(log.date, {
        total: log.ounces,
        entries: [{ ounces: log.ounces, created_at: log.created_at }],
      })
    }
  }

  const days = Array.from(dayMap.entries()).map(([date, data]) => ({
    date,
    total: data.total,
    entries: data.entries,
  }))

  // Summary stats
  const totalOunces = days.reduce((sum, d) => sum + d.total, 0)
  const daysMetGoal = days.filter((d) => d.total >= dailyGoal).length
  const avgPerDay = days.length > 0 ? Math.round(totalOunces / days.length) : 0

  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-6 px-6 py-6">
      <h1 className="text-2xl font-bold tracking-tight">History</h1>
      <HistoryFilter defaultFrom={fromDate} defaultTo={toDate} />
      <HistorySummary
        totalOunces={totalOunces}
        daysTracked={days.length}
        daysMetGoal={daysMetGoal}
        avgPerDay={avgPerDay}
        dailyGoal={dailyGoal}
      />
      <HistoryList days={days} dailyGoal={dailyGoal} />
    </main>
  )
}
