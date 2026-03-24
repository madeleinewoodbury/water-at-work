import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardRealtime from '@/components/dashboard/DashboardRealtime'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: intakeLogs },
    { data: teamUsers },
    { data: myEntries },
    { data: todayOptOuts },
    { data: todayOverrides },
  ] = await Promise.all([
    supabase
      .from('intake_logs')
      .select('id, user_id, date, ounces, created_at')
      .eq('date', today),
    supabase.from('users').select('id, email, display_name, daily_goal, avatar_url'),
    supabase
      .from('intake_logs')
      .select('id, ounces, created_at')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: true }),
    supabase
      .from('opt_outs')
      .select('id, user_id, start_date, end_date')
      .lte('start_date', today)
      .gte('end_date', today),
    supabase
      .from('daily_goal_overrides')
      .select('id, user_id, date, daily_goal')
      .eq('date', today),
  ])

  return (
    <main className="mx-auto grid w-full max-w-[1200px] gap-4 px-6 py-6 md:grid-cols-2">
      <DashboardRealtime
        initialData={{
          currentUserId: user.id,
          today,
          intakeLogs: intakeLogs ?? [],
          teamUsers: teamUsers ?? [],
          myEntries: myEntries ?? [],
          todayOptOuts: (todayOptOuts ?? []).map((o) => ({ id: o.id, user_id: o.user_id })),
          todayOverrides: todayOverrides ?? [],
        }}
      />
    </main>
  )
}
