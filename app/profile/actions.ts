'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type ActionState = { error?: string; success?: string } | null

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

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
    const { error: dbError } = await supabase
      .from('users')
      .update({ avatar_url: urlData.publicUrl })
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

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }

  redirect('/sign-in')
}
