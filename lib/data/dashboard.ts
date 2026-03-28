import { cacheLife } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Cache the team users list for ~5 minutes.
// Uses supabaseAdmin (service role) since "use cache" executes outside the
// request context and cannot access auth cookies. All authenticated users already
// have SELECT access to all users via RLS — the real-time subscription in
// DashboardRealtime corrects any stale profiles client-side immediately on change.
export async function getCachedTeamUsers() {
  'use cache'
  cacheLife('minutes')

  const { data } = await supabaseAdmin
    .from('users')
    .select('id, email, display_name, daily_goal, avatar_url')
  return (data ?? []).map((u) => ({
    ...u,
    daily_goal: Number(u.daily_goal),
  }))
}
