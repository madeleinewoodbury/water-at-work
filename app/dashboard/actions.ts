'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionState = { error: string } | null

export async function logIntake(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const raw = formData.get('ounces')
  const ounces = Number(raw)
  if (!raw || !Number.isFinite(ounces) || ounces <= 0) {
    return { error: 'Enter a valid amount greater than 0' }
  }

  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase.from('intake_logs').insert({
    user_id: user.id,
    date: today,
    ounces: Math.round(ounces),
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return null
}
