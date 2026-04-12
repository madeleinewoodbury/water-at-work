import { cacheLife, cacheTag } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Cache the team users list for ~5 minutes, scoped by team.
// Uses supabaseAdmin (service role) since "use cache" executes outside the
// request context and cannot access auth cookies. The real-time subscription in
// DashboardRealtime corrects any stale profiles client-side immediately on change.
export async function getCachedTeamUsers(teamId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(`team-users-${teamId}`)

  const { data } = await supabaseAdmin
    .from('users')
    .select('id, email, display_name, daily_goal, avatar_url, is_active')
    .eq('team_id', teamId)
    .eq('is_active', true)
  return (data ?? []).map((u) => ({
    ...u,
    daily_goal: Number(u.daily_goal),
  }))
}

// Fetch team info by slug (for team detail pages)
export async function getTeamBySlug(slug: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(`team-${slug}`)

  const { data } = await supabaseAdmin
    .from('teams')
    .select('id, name, slug, created_by, created_at')
    .eq('slug', slug)
    .single()
  return data
}

// Fetch current user's team info
export async function getUserTeamInfo(userId: string) {
  const { data } = await supabaseAdmin
    .from('users')
    .select('team_id, team_role')
    .eq('id', userId)
    .single()
  return data as { team_id: string | null; team_role: string | null } | null
}
