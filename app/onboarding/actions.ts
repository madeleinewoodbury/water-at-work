'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const rawName = formData.get('display_name')
  const displayName = typeof rawName === 'string' ? rawName.trim() : ''
  if (!displayName) redirect('/onboarding?error=Display+name+is+required')
  if (displayName.length > 50)
    redirect('/onboarding?error=Display+name+must+be+50+characters+or+fewer')

  const rawGoal = formData.get('daily_goal')
  const dailyGoal = Number(rawGoal)
  if (!rawGoal || !Number.isFinite(dailyGoal) || dailyGoal <= 0) {
    redirect('/onboarding?error=Enter+a+valid+goal+greater+than+0')
  }

  const { error } = await supabase
    .from('users')
    .update({ display_name: displayName, daily_goal: Math.round(dailyGoal) })
    .eq('id', user.id)

  if (error) redirect(`/onboarding?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/', 'layout')
  revalidatePath('/dashboard')
  redirect('/dashboard')
}
