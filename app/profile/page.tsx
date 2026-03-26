import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileIdentityCard from '@/components/profile/ProfileIdentityCard'
import DailyGoalForm from '@/components/profile/DailyGoalForm'
import ChangePasswordForm from '@/components/profile/ChangePasswordForm'
import DangerZoneCard from '@/components/profile/DangerZoneCard'
import OptOutSchedulerCard from '@/components/profile/OptOutSchedulerCard'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const today = new Date().toISOString().split('T')[0]

  const [{ data: profile }, { data: scheduledOptOuts }] = await Promise.all([
    supabase
      .from('users')
      .select('display_name, daily_goal, email, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('opt_outs')
      .select('id, start_date, end_date')
      .eq('user_id', user.id)
      .gte('end_date', today)
      .order('start_date', { ascending: true }),
  ])

  const email = profile?.email ?? user.email ?? ''
  const currentGoal = Number(profile?.daily_goal ?? 32)

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-6">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Profile</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <DailyGoalForm currentGoal={currentGoal} />
        <ProfileIdentityCard
          currentAvatarUrl={profile?.avatar_url ?? null}
          email={email}
          displayName={profile?.display_name ?? null}
        />
        <OptOutSchedulerCard scheduledOptOuts={scheduledOptOuts ?? []} />
        <ChangePasswordForm />
        <DangerZoneCard />
      </div>
    </main>
  )
}
