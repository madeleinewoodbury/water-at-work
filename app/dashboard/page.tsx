import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDisplayName } from '@/lib/utils'
import WaterInputCard from '@/components/dashboard/WaterInputCard'
import TeamProgressCard from '@/components/dashboard/TeamProgressCard'
import UserListCard from '@/components/dashboard/UserListCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const today = new Date().toISOString().split('T')[0]

  const [{ data: intakeLogs }, { data: teamUsers }, { data: myEntries }, { data: todayOptOuts }] =
    await Promise.all([
      supabase.from('intake_logs').select('user_id, ounces').eq('date', today),
      supabase.from('users').select('id, email, display_name, daily_goal, avatar_url'),
      supabase
        .from('intake_logs')
        .select('id, ounces, created_at')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: true }),
      supabase
        .from('opt_outs')
        .select('id, user_id')
        .lte('start_date', today)
        .gte('end_date', today),
    ])

  const optedOutUserIds = new Set((todayOptOuts ?? []).map((o) => o.user_id))
  const currentUserOptOut = (todayOptOuts ?? []).find((o) => o.user_id === user.id)

  const userTotals: Record<string, number> = {}
  for (const row of intakeLogs ?? []) {
    userTotals[row.user_id] = (userTotals[row.user_id] ?? 0) + row.ounces
  }

  const currentUser = (teamUsers ?? []).find((u) => u.id === user.id)
  const personalTotal = userTotals[user.id] ?? 0
  const personalGoal = currentUser?.daily_goal ?? 32

  const activeUsers = (teamUsers ?? []).filter((u) => !optedOutUserIds.has(u.id))
  const teamTotal = activeUsers.reduce((s, u) => s + (userTotals[u.id] ?? 0), 0)
  const teamGoal = activeUsers.reduce((sum, u) => sum + (u.daily_goal ?? 32), 0)

  const userList = (teamUsers ?? [])
    .map((u) => ({
      id: u.id,
      displayName: getDisplayName(u),
      ounces: userTotals[u.id] ?? 0,
      avatarUrl: u.avatar_url ?? null,
      email: u.email,
      isOptedOut: optedOutUserIds.has(u.id),
    }))
    .sort((a, b) => {
      if (a.isOptedOut !== b.isOptedOut) return a.isOptedOut ? 1 : -1
      return b.ounces - a.ounces
    })

  return (
    <main className="mx-auto grid w-full max-w-[1200px] gap-4 px-6 py-6 md:grid-cols-2">
      <WaterInputCard
        personalTotal={personalTotal}
        dailyGoal={personalGoal}
        entries={myEntries ?? []}
        isOptedOut={!!currentUserOptOut}
        optOutId={currentUserOptOut?.id ?? null}
      />
      <TeamProgressCard
        teamTotal={teamTotal}
        participantCount={activeUsers.length}
        totalMemberCount={teamUsers?.length ?? 0}
        teamGoal={teamGoal}
      />
      <UserListCard users={userList} currentUserId={user.id} />
    </main>
  )
}
