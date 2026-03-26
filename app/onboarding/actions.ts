'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

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
  const normalizedGoal = roundToOneDecimal(dailyGoal)

  // Determine avatar_url
  let avatarUrl: string | null = null

  const file = formData.get('file') as File | null
  if (file && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      redirect('/onboarding?error=File+must+be+a+JPEG%2C+PNG%2C+GIF%2C+or+WebP+image')
    }
    if (file.size > MAX_SIZE) {
      redirect('/onboarding?error=File+must+be+2+MB+or+smaller')
    }

    const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
    const path = `${user.id}/avatar.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, buffer, { upsert: true, contentType: file.type })
    if (uploadError) {
      redirect(`/onboarding?error=${encodeURIComponent(uploadError.message)}`)
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`
  } else {
    const rawAvatar = formData.get('avatar_url')
    avatarUrl = typeof rawAvatar === 'string' && rawAvatar.trim() ? rawAvatar.trim() : null
  }

  const { error } = await supabase
    .from('users')
    .update({
      display_name: displayName,
      daily_goal: normalizedGoal,
      avatar_url: avatarUrl,
    })
    .eq('id', user.id)

  if (error) redirect(`/onboarding?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/', 'layout')
  revalidatePath('/dashboard')
  redirect('/dashboard')
}
