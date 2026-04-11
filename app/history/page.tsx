import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDisplayName } from '@/lib/utils'
import HistoryFilter from '@/components/history/HistoryFilter'
import HistorySummary from '@/components/history/HistorySummary'
import HistoryList from '@/components/history/HistoryList'
import HistoryTabs from '@/components/history/HistoryTabs'
import TeamHistoryList from '@/components/history/TeamHistoryList'

type SearchParams = Promise<{ from?: string; to?: string; tab?: string; show_weekends?: string }>

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

  // Fetch user's team info
  const { data: userProfile } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .single()

  const teamId = userProfile?.team_id as string | null
  const hasTeam = !!teamId

  const tab = params.tab === 'team' && hasTeam ? 'team' : 'personal'
  const excludeWeekends = params.show_weekends !== '1'

  function isWeekend(dateStr: string): boolean {
    const day = new Date(dateStr + 'T00:00:00').getDay()
    return day === 0 || day === 6
  }

  if (tab === 'team' && teamId) {
    const logsQuery = supabase
      .from('intake_logs')
      .select('user_id, date, ounces')
      .eq('team_id', teamId)
      .gte('date', fromDate)
      .lte('date', toDate)

    const optOutsQuery = supabase
      .from('opt_outs')
      .select('user_id, start_date, end_date')
      .eq('team_id', teamId)
      .lte('start_date', toDate)
      .gte('end_date', fromDate)

    const usersQuery = supabase
      .from('users')
      .select('id, email, display_name, daily_goal, created_at')
      .eq('team_id', teamId)

    const overridesQuery = supabase
      .from('daily_goal_overrides')
      .select('user_id, date, daily_goal')
      .eq('team_id', teamId)
      .gte('date', fromDate)
      .lte('date', toDate)

    const [{ data: allLogs }, { data: allOptOuts }, { data: allUsers }, { data: allOverrides }] =
      await Promise.all([logsQuery, optOutsQuery, usersQuery, overridesQuery])

    // Build opt-out range map per user
    const optOutMap = new Map<string, { start: string; end: string }[]>()
    for (const o of allOptOuts ?? []) {
      const ranges = optOutMap.get(o.user_id) ?? []
      ranges.push({ start: o.start_date, end: o.end_date })
      optOutMap.set(o.user_id, ranges)
    }

    function isOptedOut(userId: string, date: string): boolean {
      return (optOutMap.get(userId) ?? []).some((r) => r.start <= date && r.end >= date)
    }

    // Build override lookup: date -> user_id -> override goal
    const overrideLookup = new Map<string, Map<string, number>>()
    for (const o of allOverrides ?? []) {
      let dateMap = overrideLookup.get(o.date)
      if (!dateMap) {
        dateMap = new Map()
        overrideLookup.set(o.date, dateMap)
      }
      dateMap.set(o.user_id, Number(o.daily_goal))
    }

    function getEffectiveGoal(userId: string, date: string, baseGoal: number): number {
      return overrideLookup.get(date)?.get(userId) ?? baseGoal
    }

    function hasJoinedByDate(createdAt: string | null | undefined, date: string): boolean {
      if (!createdAt) return true
      return createdAt.slice(0, 10) <= date
    }

    // Group logs by date
    const logsByDate = new Map<string, { user_id: string; ounces: number }[]>()
    for (const log of allLogs ?? []) {
      const arr = logsByDate.get(log.date) ?? []
      arr.push({ user_id: log.user_id, ounces: log.ounces })
      logsByDate.set(log.date, arr)
    }

    const totalMemberCount = allUsers?.length ?? 0

    const teamDays = Array.from(logsByDate.entries())
      .map(([date, logs]) => {
        const activeUsers = (allUsers ?? []).filter(
          (u) => hasJoinedByDate(u.created_at, date) && !isOptedOut(u.id, date)
        )
        const teamGoal = activeUsers.reduce(
          (s, u) => s + getEffectiveGoal(u.id, date, Number(u.daily_goal ?? 32)),
          0
        )

        const userTotals: Record<string, number> = {}
        for (const log of logs) {
          if (!isOptedOut(log.user_id, date)) {
            userTotals[log.user_id] = (userTotals[log.user_id] ?? 0) + Number(log.ounces)
          }
        }
        const teamTotal = Object.values(userTotals).reduce((s, n) => s + n, 0)

        const userMap = new Map((allUsers ?? []).map((u) => [u.id, u]))
        const members = Object.entries(userTotals)
          .map(([uid, oz]) => {
            const u = userMap.get(uid)
            return { name: u ? getDisplayName(u) : 'Unknown', ounces: oz }
          })
          .sort((a, b) => b.ounces - a.ounces)

        return {
          date,
          participantCount: activeUsers.length,
          totalMemberCount,
          teamTotal,
          teamGoal,
          metGoal: teamGoal > 0 && teamTotal >= teamGoal,
          members,
        }
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((d) => !excludeWeekends || !isWeekend(d.date))

    return (
      <main className="mx-auto w-full max-w-[1200px] space-y-6 px-6 py-6">
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <HistoryTabs activeTab="team" hasTeam={hasTeam} />
        <HistoryFilter defaultFrom={fromDate} defaultTo={toDate} />
        <TeamHistoryList teamDays={teamDays} />
      </main>
    )
  }

  const [{ data: logs }, { data: profile }, { data: myOverrides }] = await Promise.all([
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
    supabase
      .from('daily_goal_overrides')
      .select('date, daily_goal')
      .eq('user_id', user.id)
      .gte('date', fromDate)
      .lte('date', toDate),
  ])

  const dailyGoal = Number(profile?.daily_goal ?? 32)

  // Build per-day override lookup
  const overridesByDate = new Map(
    (myOverrides ?? []).map((o) => [o.date, Number(o.daily_goal)])
  )
  const getEffectiveGoal = (date: string) => overridesByDate.get(date) ?? dailyGoal

  // Group logs by date
  const dayMap = new Map<
    string,
    { total: number; entries: { ounces: number; created_at: string }[] }
  >()

  for (const log of logs ?? []) {
    const ounces = Number(log.ounces)
    const existing = dayMap.get(log.date)
    if (existing) {
      existing.total += ounces
      existing.entries.push({ ounces, created_at: log.created_at })
    } else {
      dayMap.set(log.date, {
        total: ounces,
        entries: [{ ounces, created_at: log.created_at }],
      })
    }
  }

  const days = Array.from(dayMap.entries())
    .map(([date, data]) => ({
      date,
      total: data.total,
      entries: data.entries,
      effectiveGoal: getEffectiveGoal(date),
    }))
    .filter((d) => !excludeWeekends || !isWeekend(d.date))

  // Summary stats
  const totalOunces = days.reduce((sum, d) => sum + d.total, 0)
  const daysMetGoal = days.filter((d) => d.total >= d.effectiveGoal).length
  const avgPerDay = days.length > 0 ? Math.round(totalOunces / days.length) : 0

  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-6 px-6 py-6">
      <h1 className="text-2xl font-bold tracking-tight">History</h1>
      <HistoryTabs activeTab="personal" hasTeam={hasTeam} />
      <HistoryFilter defaultFrom={fromDate} defaultTo={toDate} />
      <HistorySummary
        totalOunces={totalOunces}
        daysTracked={days.length}
        daysMetGoal={daysMetGoal}
        avgPerDay={avgPerDay}
      />
      <HistoryList days={days} />
    </main>
  )
}
