'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionState = { error?: string; success?: string } | null

export async function updateDisplayName(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const raw = formData.get('display_name')
  const displayName = typeof raw === 'string' ? raw.trim() : ''

  if (!displayName) return { error: 'Display name cannot be empty' }
  if (displayName.length > 50) return { error: 'Display name must be 50 characters or fewer' }

  const { error } = await supabase
    .from('users')
    .update({ display_name: displayName })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: 'Display name updated' }
}

export async function updateDailyGoal(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const raw = formData.get('daily_goal')
  const dailyGoal = Number(raw)

  if (!raw || !Number.isFinite(dailyGoal) || dailyGoal <= 0) {
    return { error: 'Enter a valid goal greater than 0' }
  }

  const { error } = await supabase
    .from('users')
    .update({ daily_goal: Math.round(dailyGoal) })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: 'Daily goal updated' }
}

export async function changePassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) return { error: 'Not authenticated' }

  const currentPassword = formData.get('current_password') as string
  const newPassword = formData.get('new_password') as string

  if (!currentPassword || !newPassword) {
    return { error: 'Both fields are required' }
  }

  if (newPassword.length < 6) {
    return { error: 'New password must be at least 6 characters' }
  }

  // Verify the current password by attempting sign-in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInError) {
    return { error: 'Current password is incorrect' }
  }

  // Update to the new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateError) return { error: updateError.message }

  return { success: 'Password updated successfully' }
}
