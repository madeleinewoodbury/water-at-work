import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DisplayNameForm from '@/components/profile/DisplayNameForm'
import DailyGoalForm from '@/components/profile/DailyGoalForm'
import ChangePasswordForm from '@/components/profile/ChangePasswordForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, daily_goal, email')
    .eq('id', user.id)
    .single()

  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-6 px-6 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      <DisplayNameForm
        currentName={profile?.display_name ?? null}
        email={profile?.email ?? user.email ?? ''}
      />
      <DailyGoalForm currentGoal={profile?.daily_goal ?? 32} />
      <ChangePasswordForm />
    </main>
  )
}
