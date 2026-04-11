import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import TeamCard from '@/components/teams/TeamCard'

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

  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-6 px-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
        {!userTeamId && !pendingRequestId && (
          <Link
            href="/teams/create"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
          >
            Create Team
          </Link>
        )}
      </div>

      {userTeamId && (
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
          You are a member of a team.{' '}
          <Link
            href={`/teams/${teamsWithCounts.find((t) => t.id === userTeamId)?.slug ?? ''}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Manage your team
          </Link>
        </div>
      )}

      {pendingRequestId && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
          You have a pending request to join a team.
        </div>
      )}

      {teamsWithCounts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-6 py-8 text-center text-muted-foreground">
          No teams yet. Be the first to create one!
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teamsWithCounts.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              isUserTeam={team.id === userTeamId}
              isPending={team.id === pendingTeamId}
              pendingRequestId={pendingRequestId}
              canJoin={!userTeamId && !pendingTeamId}
            />
          ))}
        </div>
      )}
    </main>
  )
}
