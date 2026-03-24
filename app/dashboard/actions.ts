'use server'

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

  return null
}

export async function updateIntake(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id')
  if (!id || typeof id !== 'string') return { error: 'Invalid entry' }

  const raw = formData.get('ounces')
  const ounces = Number(raw)
  if (!raw || !Number.isFinite(ounces) || ounces <= 0) {
    return { error: 'Enter a valid amount greater than 0' }
  }

  const { error } = await supabase
    .from('intake_logs')
    .update({ ounces: Math.round(ounces), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  return null
}

export async function deleteIntake(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id')
  if (!id || typeof id !== 'string') return { error: 'Invalid entry' }

  const { error } = await supabase
    .from('intake_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  return null
}

export async function optOutToday(): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase.from('opt_outs').insert({
    user_id: user.id,
    start_date: today,
    end_date: today,
  })

  if (error) return { error: error.message }

  return null
}

export async function optBackIn(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id')
  if (!id || typeof id !== 'string') return { error: 'Invalid entry' }

  const { error } = await supabase
    .from('opt_outs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  return null
}

export async function setDailyGoalOverride(
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

  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase.from('daily_goal_overrides').upsert(
    {
      user_id: user.id,
      date: today,
      daily_goal: Math.round(dailyGoal),
    },
    { onConflict: 'user_id,date' }
  )

  if (error) return { error: error.message }

  return null
}

export async function clearDailyGoalOverride(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id')
  if (!id || typeof id !== 'string') return { error: 'Invalid entry' }

  const { error } = await supabase
    .from('daily_goal_overrides')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  return null
}
