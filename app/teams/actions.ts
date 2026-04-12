'use server'

import { redirect } from 'next/navigation'
import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type ActionState = { error?: string; success?: string } | null

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function createTeam(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const rawName = formData.get('name')
  const name = typeof rawName === 'string' ? rawName.trim() : ''

  if (!name) return { error: 'Team name is required' }
  if (name.length > 50) return { error: 'Team name must be 50 characters or fewer' }

  // Verify user has no current team
  const { data: profile } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .single()

  if (profile?.team_id) {
    return { error: 'You are already on a team. Leave your current team first.' }
  }

  // Check for pending join requests
  const { data: pendingReq } = await supabase
    .from('team_join_requests')
    .select('id')
    .eq('requester_user_id', user.id)
    .eq('status', 'pending')
    .limit(1)

  if (pendingReq && pendingReq.length > 0) {
    return { error: 'You have a pending request to join a team. Cancel it before creating a new team.' }
  }

  const slug = generateSlug(name)
  if (!slug) return { error: 'Team name must contain at least one letter or number' }

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from('teams')
    .select('id')
    .eq('slug', slug)
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: 'A team with a similar name already exists. Try a different name.' }
  }

  // Create the team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({ name, slug, created_by: user.id })
    .select('id')
    .single()

  if (teamError || !team) return { error: teamError?.message ?? 'Failed to create team' }

  // Set user as admin of the new team
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ team_id: team.id, team_role: 'admin' })
    .eq('id', user.id)

  if (updateError) return { error: updateError.message }

  revalidatePath('/teams')
  redirect(`/teams/${slug}`)
}

export async function updateTeam(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const teamId = formData.get('team_id') as string
  if (!teamId) return { error: 'Invalid team' }

  // Verify user is admin of this team
  const { data: profile } = await supabase
    .from('users')
    .select('team_id, team_role')
    .eq('id', user.id)
    .single()

  if (profile?.team_id !== teamId || profile?.team_role !== 'admin') {
    return { error: 'Only the team admin can update the team' }
  }

  const rawName = formData.get('name')
  const name = typeof rawName === 'string' ? rawName.trim() : ''

  if (!name) return { error: 'Team name is required' }
  if (name.length > 50) return { error: 'Team name must be 50 characters or fewer' }

  const slug = generateSlug(name)
  if (!slug) return { error: 'Team name must contain at least one letter or number' }

  // Check slug uniqueness (exclude current team)
  const { data: existing } = await supabase
    .from('teams')
    .select('id')
    .eq('slug', slug)
    .neq('id', teamId)
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: 'A team with a similar name already exists. Try a different name.' }
  }

  const { error } = await supabase
    .from('teams')
    .update({ name, slug })
    .eq('id', teamId)

  if (error) return { error: error.message }

  revalidatePath('/teams')
  revalidateTag(`team-${slug}`, { expire: 0 })
  redirect(`/teams/${slug}`)
}

export async function requestToJoin(teamId: string): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Verify user has no current team
  const { data: profile } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .single()

  if (profile?.team_id) {
    return { error: 'You are already on a team. Leave your current team first.' }
  }

  const { error } = await supabase.from('team_join_requests').insert({
    team_id: teamId,
    requester_user_id: user.id,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'You already have a pending request' }
    }
    return { error: error.message }
  }

  // Notify team admins about the join request
  const [{ data: requesterProfile }, { data: admins }, { data: teamInfo }] = await Promise.all([
    supabase
      .from('users')
      .select('display_name, email')
      .eq('id', user.id)
      .single(),
    supabaseAdmin
      .from('users')
      .select('id')
      .eq('team_id', teamId)
      .eq('team_role', 'admin'),
    supabaseAdmin
      .from('teams')
      .select('slug')
      .eq('id', teamId)
      .single(),
  ])

  const requesterName = requesterProfile?.display_name || requesterProfile?.email?.split('@')[0] || 'Someone'

  if (admins && admins.length > 0) {
    await supabaseAdmin.from('notifications').insert(
      admins.map((admin) => ({
        user_id: admin.id,
        type: 'join_request' as const,
        message: `${requesterName} has requested to join your team.`,
        link: teamInfo?.slug ? `/teams/${teamInfo.slug}` : null,
      }))
    )
  }

  revalidatePath('/teams')
  return { success: 'Request sent' }
}

export async function cancelRequest(requestId: string): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('team_join_requests')
    .delete()
    .eq('id', requestId)
    .eq('requester_user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/teams')
  return { success: 'Request cancelled' }
}

export async function approveRequest(requestId: string): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Fetch the request
  const { data: request } = await supabase
    .from('team_join_requests')
    .select('id, team_id, requester_user_id, status')
    .eq('id', requestId)
    .single()

  if (!request) return { error: 'Request not found' }
  if (request.status !== 'pending') return { error: 'Request is no longer pending' }

  // Verify current user is admin of the target team
  const { data: adminProfile } = await supabase
    .from('users')
    .select('team_id, team_role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.team_id !== request.team_id || adminProfile?.team_role !== 'admin') {
    return { error: 'Only the team admin can approve requests' }
  }

  // Approve the request
  const { error: updateError } = await supabase
    .from('team_join_requests')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (updateError) return { error: updateError.message }

  // Add the requester to the team (admin client — RLS only allows self-updates).
  // Split into two updates so Supabase real-time delivers the second event to
  // dashboards filtering on team_id — the first update sets team_id (old record
  // has null, may not match the filter), the second fires with team_id already set.
  const { error: teamError2 } = await supabaseAdmin
    .from('users')
    .update({ team_id: request.team_id })
    .eq('id', request.requester_user_id)

  if (teamError2) return { error: teamError2.message }

  const { error: roleError } = await supabaseAdmin
    .from('users')
    .update({ team_role: 'member' })
    .eq('id', request.requester_user_id)

  if (roleError) return { error: roleError.message }

  // Carry over today's activity so it appears on the team dashboard
  const today = new Date().toISOString().split('T')[0]
  await Promise.all([
    supabaseAdmin
      .from('intake_logs')
      .update({ team_id: request.team_id })
      .eq('user_id', request.requester_user_id)
      .eq('date', today)
      .is('team_id', null),
    supabaseAdmin
      .from('opt_outs')
      .update({ team_id: request.team_id })
      .eq('user_id', request.requester_user_id)
      .eq('date', today)
      .is('team_id', null),
    supabaseAdmin
      .from('daily_goal_overrides')
      .update({ team_id: request.team_id })
      .eq('user_id', request.requester_user_id)
      .eq('date', today)
      .is('team_id', null),
  ])

  // Notify the requester that they've been accepted
  const { data: team } = await supabaseAdmin
    .from('teams')
    .select('name')
    .eq('id', request.team_id)
    .single()

  await supabaseAdmin.from('notifications').insert({
    user_id: request.requester_user_id,
    type: 'request_approved',
    message: `You have been accepted into ${team?.name ?? 'the team'}!`,
  })

  revalidatePath('/teams')
  revalidateTag(`team-users-${request.team_id}`, { expire: 0 })
  return { success: 'Request approved' }
}

export async function rejectRequest(requestId: string): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Fetch the request
  const { data: request } = await supabase
    .from('team_join_requests')
    .select('id, team_id, requester_user_id, status')
    .eq('id', requestId)
    .single()

  if (!request) return { error: 'Request not found' }
  if (request.status !== 'pending') return { error: 'Request is no longer pending' }

  // Verify current user is admin
  const { data: adminProfile } = await supabase
    .from('users')
    .select('team_id, team_role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.team_id !== request.team_id || adminProfile?.team_role !== 'admin') {
    return { error: 'Only the team admin can reject requests' }
  }

  const { error } = await supabase
    .from('team_join_requests')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) return { error: error.message }

  // Notify the requester that their request was rejected
  const { data: team } = await supabaseAdmin
    .from('teams')
    .select('name')
    .eq('id', request.team_id)
    .single()

  await supabaseAdmin.from('notifications').insert({
    user_id: request.requester_user_id,
    type: 'request_rejected',
    message: `Your request to join ${team?.name ?? 'the team'} was not accepted.`,
  })

  revalidatePath('/teams')
  return { success: 'Request rejected' }
}

export async function kickMember(userId: string): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }
  if (userId === user.id) return { error: 'You cannot kick yourself. Use "Leave Team" instead.' }

  // Verify current user is admin
  const { data: adminProfile } = await supabase
    .from('users')
    .select('team_id, team_role')
    .eq('id', user.id)
    .single()

  if (!adminProfile?.team_id || adminProfile.team_role !== 'admin') {
    return { error: 'Only the team admin can kick members' }
  }

  // Verify target is on the same team
  const { data: targetProfile } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', userId)
    .single()

  if (targetProfile?.team_id !== adminProfile.team_id) {
    return { error: 'This user is not on your team' }
  }

  // Fetch team name for the notification
  const { data: team } = await supabaseAdmin
    .from('teams')
    .select('name')
    .eq('id', adminProfile.team_id)
    .single()

  // Admin client — RLS only allows users to update their own row
  const { error } = await supabaseAdmin
    .from('users')
    .update({ team_id: null, team_role: null })
    .eq('id', userId)

  if (error) return { error: error.message }

  // Notify the kicked member
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type: 'member_kicked',
    message: `You have been removed from ${team?.name ?? 'the team'}.`,
  })

  revalidatePath('/teams')
  revalidateTag(`team-users-${adminProfile.team_id}`, { expire: 0 })
  return { success: 'Member removed' }
}

export async function leaveTeam(): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('users')
    .select('team_id, team_role')
    .eq('id', user.id)
    .single()

  if (!profile?.team_id) return { error: 'You are not on a team' }

  const teamId = profile.team_id

  // Collect info for notifications before making changes
  const [{ data: userProfile }, { data: teamInfo }, { data: allMembers }] = await Promise.all([
    supabase.from('users').select('display_name, email').eq('id', user.id).single(),
    supabaseAdmin.from('teams').select('name').eq('id', teamId).single(),
    supabaseAdmin.from('users').select('id').eq('team_id', teamId).neq('id', user.id),
  ])

  const displayName = userProfile?.display_name || userProfile?.email?.split('@')[0] || 'A teammate'

  if (profile.team_role === 'admin') {
    // Check if other members exist
    const { data: members } = await supabase
      .from('users')
      .select('id, created_at')
      .eq('team_id', teamId)
      .neq('id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    if (members && members.length > 0) {
      // Promote oldest remaining member to admin (admin client — RLS blocks cross-user updates)
      const { error: promoteError } = await supabaseAdmin
        .from('users')
        .update({ team_role: 'admin' })
        .eq('id', members[0].id)

      if (promoteError) return { error: promoteError.message }
    } else {
      // Sole member — delete the team (no one left to notify)
      const { error: deleteError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (deleteError) return { error: deleteError.message }

      revalidatePath('/teams')
      revalidateTag(`team-users-${teamId}`, { expire: 0 })
      redirect('/teams')
    }
  }

  // Remove user from team
  const { error } = await supabaseAdmin
    .from('users')
    .update({ team_id: null, team_role: null })
    .eq('id', user.id)

  if (error) return { error: error.message }

  // Notify remaining team members
  const otherMemberIds = (allMembers ?? []).map((m) => m.id)
  if (otherMemberIds.length > 0) {
    await supabaseAdmin.from('notifications').insert(
      otherMemberIds.map((memberId) => ({
        user_id: memberId,
        type: 'member_left' as const,
        message: `${displayName} has left ${teamInfo?.name ?? 'the team'}.`,
      }))
    )
  }

  revalidatePath('/teams')
  revalidateTag(`team-users-${teamId}`, { expire: 0 })
  redirect('/teams')
}

export async function deleteTeam(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const confirmation = formData.get('confirmation')
  if (confirmation !== 'DELETE') return { error: 'Type DELETE to confirm' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('users')
    .select('team_id, team_role')
    .eq('id', user.id)
    .single()

  if (!profile?.team_id || profile.team_role !== 'admin') {
    return { error: 'Only the team admin can delete the team' }
  }

  const teamId = profile.team_id

  // Collect member IDs and team name before deletion
  const [{ data: members }, { data: team }] = await Promise.all([
    supabaseAdmin.from('users').select('id').eq('team_id', teamId),
    supabaseAdmin.from('teams').select('name').eq('id', teamId).single(),
  ])

  const teamName = team?.name ?? 'Your team'

  // Delete the team using admin client (RLS requires admin's team_id to still
  // be set, so we must delete before clearing memberships).
  // CASCADE cleans up join requests; ON DELETE SET NULL nulls users.team_id.
  const { error } = await supabaseAdmin
    .from('teams')
    .delete()
    .eq('id', teamId)

  if (error) return { error: error.message }

  // Clean up team_role (ON DELETE SET NULL only affects the team_id FK column)
  if (members && members.length > 0) {
    const memberIds = members.map((m) => m.id)

    await supabaseAdmin
      .from('users')
      .update({ team_role: null })
      .in('id', memberIds)

    // Notify all members (except the admin who deleted) that the team was deleted
    const otherMembers = memberIds.filter((id) => id !== user.id)
    if (otherMembers.length > 0) {
      await supabaseAdmin.from('notifications').insert(
        otherMembers.map((memberId) => ({
          user_id: memberId,
          type: 'team_deleted' as const,
          message: `${teamName} has been deleted by the team admin.`,
        }))
      )
    }
  }

  revalidatePath('/teams')
  revalidateTag(`team-users-${teamId}`, { expire: 0 })
  redirect('/teams')
}
