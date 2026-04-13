import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import TeamsBrowser from '@/components/teams/TeamsBrowser'

export default async function TeamsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  // Fetch current user's team info and pending request
  const [{ data: profile }, { data: pendingRequest }] = await Promise.all([
    supabase
      .from('users')
      .select('team_id, team_role')
      .eq('id', user.id)
      .single(),
    supabase
      .from('team_join_requests')
      .select('id, team_id')
      .eq('requester_user_id', user.id)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle(),
  ])

  const userTeamId = profile?.team_id as string | null
  const pendingTeamId = pendingRequest?.team_id as string | null
  const pendingRequestId = pendingRequest?.id as string | null

  // Fetch all teams with member counts using admin client
  const { data: teams } = await supabaseAdmin.from('teams').select('id, name, slug, created_at')
  const teamList = teams ?? []

  // Get member counts per team
  const { data: memberCounts } = await supabaseAdmin
    .from('users')
    .select('team_id')
    .not('team_id', 'is', null)

  const countMap = new Map<string, number>()
  for (const row of memberCounts ?? []) {
    const tid = row.team_id as string
    countMap.set(tid, (countMap.get(tid) ?? 0) + 1)
  }

  const teamsWithCounts = teamList
    .map((t) => ({
      ...t,
      memberCount: countMap.get(t.id) ?? 0,
    }))
    .sort((a, b) => b.memberCount - a.memberCount)

  const userTeam = userTeamId ? teamsWithCounts.find((t) => t.id === userTeamId) : null

  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-6 px-6 py-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
        {userTeamId && userTeam ? (
          <Link
            href={`/teams/${userTeam.slug}`}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
          >
            My Team
          </Link>
        ) : !pendingRequestId ? (
          <Link
            href="/teams/create"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
          >
            Create Team
          </Link>
        ) : null}
      </div>

      <TeamsBrowser
        teams={teamsWithCounts}
        userTeamId={userTeamId}
        pendingTeamId={pendingTeamId}
        pendingRequestId={pendingRequestId}
      />
    </main>
  )
}
