'use server'

import { redirect } from 'next/navigation'
import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type ActionState = { error?: string; success?: string } | null

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

export async function updateAvatar(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const avatarType = formData.get('avatar_type') as string

  if (avatarType === 'gravatar') {
    const { error } = await supabase
      .from('users')
      .update({ avatar_url: 'gravatar' })
      .eq('id', user.id)
    if (error) return { error: error.message }
    revalidatePath('/', 'layout')
    return { success: 'Avatar updated' }
  }

  if (avatarType === 'preset') {
    const value = formData.get('avatar_url') as string
    if (!value?.startsWith('preset:') && !value?.startsWith('icon:')) return { error: 'Invalid preset' }
    const { error } = await supabase
      .from('users')
      .update({ avatar_url: value })
      .eq('id', user.id)
    if (error) return { error: error.message }
    revalidatePath('/', 'layout')
    return { success: 'Avatar updated' }
  }

  if (avatarType === 'upload') {
    const file = formData.get('file') as File | null
    if (!file || file.size === 0) return { error: 'No file selected' }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: 'File must be a JPEG, PNG, GIF, or WebP image' }
    }
    if (file.size > MAX_SIZE) return { error: 'File must be 2 MB or smaller' }

    const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
    const path = `${user.id}/avatar.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, buffer, { upsert: true, contentType: file.type })
    if (uploadError) return { error: uploadError.message }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const avatarUrlWithCacheBust = `${urlData.publicUrl}?t=${Date.now()}`
    const { error: dbError } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrlWithCacheBust })
      .eq('id', user.id)
    if (dbError) return { error: dbError.message }

    revalidatePath('/', 'layout')
    return { success: 'Avatar updated' }
  }

  return { error: 'Invalid request' }
}

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
  const normalizedGoal = roundToOneDecimal(dailyGoal)

  // Fetch the current goal so we can preserve it for historical days
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('daily_goal')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Could not read current goal' }
  }

  const oldGoal = roundToOneDecimal(Number(profile.daily_goal))

  // Skip backfill if the goal hasn't actually changed
  if (oldGoal !== normalizedGoal) {
    const today = new Date().toISOString().split('T')[0]

    // Find past dates with intake logs but no existing override
    const [
      { data: logDates, error: logError },
      { data: existingOverrides, error: overrideError },
    ] = await Promise.all([
      supabase
        .from('intake_logs')
        .select('date')
        .eq('user_id', user.id)
        .lt('date', today),
      supabase
        .from('daily_goal_overrides')
        .select('date')
        .eq('user_id', user.id)
        .lt('date', today),
    ])

    if (logError || overrideError) {
      return { error: 'Could not read history for goal backfill' }
    }

    const existingOverrideDates = new Set(
      (existingOverrides ?? []).map((o) => o.date)
    )
    const datesToBackfill = [
      ...new Set((logDates ?? []).map((l) => l.date)),
    ].filter((d) => !existingOverrideDates.has(d))

    if (datesToBackfill.length > 0) {
      const rows = datesToBackfill.map((date) => ({
        user_id: user.id,
        date,
        daily_goal: oldGoal,
      }))
      const { error: backfillError } = await supabase
        .from('daily_goal_overrides')
        .upsert(rows, { onConflict: 'user_id,date', ignoreDuplicates: true })

      if (backfillError) return { error: backfillError.message }
    }
  }

  // Fetch team_id for cache tag revalidation
  const { data: teamProfile } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .single()

  const { error } = await supabase
    .from('users')
    .update({ daily_goal: normalizedGoal })
    .eq('id', user.id)

  if (error) return { error: error.message }

  if (teamProfile?.team_id) {
    revalidateTag(`team-users-${teamProfile.team_id}`, { expire: 0 })
  }
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

export async function deleteAccount(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const confirmation = formData.get('confirmation') as string
  if (confirmation !== 'DELETE') return { error: 'Type DELETE to confirm' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Handle team admin succession before deleting
  const { data: profile } = await supabase
    .from('users')
    .select('team_id, team_role')
    .eq('id', user.id)
    .single()

  if (profile?.team_id && profile.team_role === 'admin') {
    // Check if other members exist
    const { data: members } = await supabase
      .from('users')
      .select('id, created_at')
      .eq('team_id', profile.team_id)
      .neq('id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    if (members && members.length > 0) {
      // Promote oldest remaining member to admin
      await supabaseAdmin
        .from('users')
        .update({ team_role: 'admin' })
        .eq('id', members[0].id)
    } else {
      // Sole member — delete the team
      await supabaseAdmin
        .from('teams')
        .delete()
        .eq('id', profile.team_id)
    }
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }

  if (profile?.team_id) {
    revalidateTag(`team-users-${profile.team_id}`, { expire: 0 })
  }

  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function addOptOut(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const startDate = formData.get('start_date') as string
  const endDate = formData.get('end_date') as string

  const isValidDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s))
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return { error: 'Invalid date format' }
  }
  if (endDate < startDate) {
    return { error: 'End date must be on or after start date' }
  }

  const today = new Date().toISOString().split('T')[0]
  if (startDate < today) {
    return { error: 'Start date cannot be in the past' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .single()

  const { error } = await supabase.from('opt_outs').insert({
    user_id: user.id,
    opted_out_by: user.id,
    start_date: startDate,
    end_date: endDate,
    team_id: profile?.team_id ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: 'Opt-out scheduled' }
}

export async function deleteOptOut(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id') as string
  if (!id) return { error: 'Invalid entry' }

  const { error } = await supabase
    .from('opt_outs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return null
}
