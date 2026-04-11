'use server'

import { createClient } from '@/lib/supabase/server'

type ActionState = { error: string } | null

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

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
  const normalizedOunces = roundToOneDecimal(ounces)

  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase.from('intake_logs').insert({
    user_id: user.id,
    date: today,
    ounces: normalizedOunces,
  })

  if (error) return { error: error.message }

  // Reactivate the user if they were marked inactive
  const { data: profile } = await supabase
    .from('users')
    .select('is_active')
    .eq('id', user.id)
    .single()

  if (profile && !profile.is_active) {
    await supabase.from('users').update({ is_active: true }).eq('id', user.id)
  }

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
  const normalizedOunces = roundToOneDecimal(ounces)

  const { error } = await supabase
    .from('intake_logs')
    .update({ ounces: normalizedOunces, updated_at: new Date().toISOString() })
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
    opted_out_by: user.id,
    start_date: today,
    end_date: today,
  })

  if (error) return { error: error.message }

  return null
}

const CUTOFF_HOUR = 12

export async function optOutUser(
  targetUserId: string,
  timezone: string
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }
  if (targetUserId === user.id) return { error: 'Use the regular opt-out for yourself' }

  // Compute "today" and current hour in the caller's timezone
  const now = new Date()
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now)
  const currentHour = parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).format(now),
    10
  )

  if (currentHour < CUTOFF_HOUR) {
    return { error: `You can only sit out others after ${CUTOFF_HOUR}:00 PM` }
  }

  // Check target has zero water logged today
  const { data: logs } = await supabase
    .from('intake_logs')
    .select('id')
    .eq('user_id', targetUserId)
    .eq('date', today)
    .limit(1)

  if (logs && logs.length > 0) {
    return { error: 'This user has already logged water today' }
  }

  // Check target is not already opted out
  const { data: existing } = await supabase
    .from('opt_outs')
    .select('id')
    .eq('user_id', targetUserId)
    .lte('start_date', today)
    .gte('end_date', today)
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: 'This user is already sitting out today' }
  }

  const { error } = await supabase.from('opt_outs').insert({
    user_id: targetUserId,
    opted_out_by: user.id,
    start_date: today,
    end_date: today,
  })

  if (error) return { error: error.message }

  return null
}

export async function undoTeamOptOut(optOutId: string): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('opt_outs')
    .delete()
    .eq('id', optOutId)
    .eq('opted_out_by', user.id)

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
  const normalizedGoal = roundToOneDecimal(dailyGoal)

  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase.from('daily_goal_overrides').upsert(
    {
      user_id: user.id,
      date: today,
      daily_goal: normalizedGoal,
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
