import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getDisplayName } from '@/lib/utils'
import MemberList from '@/components/teams/MemberList'
import JoinRequestList from '@/components/teams/JoinRequestList'
import TeamDangerZone from '@/components/teams/TeamDangerZone'
import TeamHeader from '@/components/teams/TeamHeader'

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  // Fetch team by slug
  const { data: team } = await supabaseAdmin
    .from('teams')
    .select('id, name, slug, created_by, created_at')
    .eq('slug', slug)
    .single()

  if (!team) notFound()

  // Fetch current user's profile
  const { data: profile } = await supabase
    .from('users')
    .select('team_id, team_role')
    .eq('id', user.id)
    .single()

  const isUserTeam = profile?.team_id === team.id
  const isAdmin = isUserTeam && profile?.team_role === 'admin'
  const isMember = isUserTeam && profile?.team_role === 'member'
  const canViewMemberEmails = isUserTeam

  // Fetch team members (omit email for non-members)
  const { data: members } = canViewMemberEmails
    ? await supabaseAdmin
      .from('users')
      .select('id, email, display_name, avatar_url, team_role, created_at')
      .eq('team_id', team.id)
      .order('created_at', { ascending: true })
    : await supabaseAdmin
      .from('users')
      .select('id, display_name, avatar_url, team_role, created_at')
      .eq('team_id', team.id)
      .order('created_at', { ascending: true })

  const memberList = (members ?? []).map((m: {
    id: string
    email?: string | null
    display_name: string | null
    avatar_url: string | null
    team_role: string | null
    created_at: string
  }) => ({
    id: m.id,
    displayName: getDisplayName({ display_name: m.display_name, email: m.email ?? '' }),
    email: canViewMemberEmails ? (m.email ?? null) : null,
    avatarUrl: m.avatar_url,
    teamRole: m.team_role as string,
    createdAt: m.created_at,
  }))

  // Fetch pending requests (only if admin)
  let pendingRequests: {
    id: string
    displayName: string
    email: string
    avatarUrl: string | null
    createdAt: string
  }[] = []

  if (isAdmin) {
    const { data: requests } = await supabaseAdmin
      .from('team_join_requests')
      .select('id, requester_user_id, created_at')
      .eq('team_id', team.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (requests && requests.length > 0) {
      const requesterIds = requests.map((r) => r.requester_user_id)
      const { data: requesters } = await supabaseAdmin
        .from('users')
        .select('id, email, display_name, avatar_url')
        .in('id', requesterIds)

      const requesterMap = new Map(
        (requesters ?? []).map((r) => [r.id, r])
      )

      pendingRequests = requests.map((r) => {
        const requester = requesterMap.get(r.requester_user_id)
        return {
          id: r.id,
          displayName: requester ? getDisplayName(requester) : 'Unknown',
          email: requester?.email ?? '',
          avatarUrl: requester?.avatar_url ?? null,
          createdAt: r.created_at,
        }
      })
    }
  }

  // Check if non-member has a pending request for this team
  let userPendingRequestId: string | null = null
  if (!isUserTeam) {
    const { data: pendingReq } = await supabase
      .from('team_join_requests')
      .select('id')
      .eq('team_id', team.id)
      .eq('requester_user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    userPendingRequestId = pendingReq?.id ?? null
  }

  const canJoin = !profile?.team_id && !userPendingRequestId

  return (
    <main className="mx-auto w-full max-w-200 space-y-6 px-6 py-6">
      <TeamHeader
        team={team}
        isAdmin={isAdmin}
        memberCount={memberList.length}
      />

      {isAdmin && pendingRequests.length > 0 && (
        <JoinRequestList requests={pendingRequests} />
      )}

      <MemberList
        members={memberList}
        currentUserId={user.id}
        isAdmin={isAdmin}
        isMember={isMember}
        showEmails={canViewMemberEmails}
        teamId={team.id}
        canJoin={canJoin}
        userPendingRequestId={userPendingRequestId}
      />

      {isAdmin && (
        <TeamDangerZone teamName={team.name} isSoleMember={memberList.length === 1} />
      )}

      {isMember && (
        <TeamDangerZone teamName={team.name} isMember />
      )}
    </main>
  )
}
