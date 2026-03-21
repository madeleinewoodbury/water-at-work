import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  const [{ data: intakeLogs }, { data: teamUsers }] = await Promise.all([
    supabase
      .from('intake_logs')
      .select('user_id, ounces')
      .eq('date', today),
    supabase.from('users').select('id, email'),
  ])

  const userTotals: Record<string, number> = {}
  for (const row of intakeLogs ?? []) {
    userTotals[row.user_id] = (userTotals[row.user_id] ?? 0) + row.ounces
  }

  const personalTotal = userTotals[user.id] ?? 0
  const teamTotal = Object.values(userTotals).reduce((s, n) => s + n, 0)

  const userList = (teamUsers ?? [])
    .map((u) => ({
      id: u.id,
      displayName: u.email.split('@')[0],
      ounces: userTotals[u.id] ?? 0,
    }))
    .sort((a, b) => b.ounces - a.ounces)

  return (
    <main className="container mx-auto grid gap-4 p-6 md:grid-cols-2">
      <WaterInputCard personalTotal={personalTotal} />
      <TeamProgressCard teamTotal={teamTotal} memberCount={teamUsers?.length ?? 0} />
      <UserListCard users={userList} currentUserId={user.id} />
    </main>
  )
}
