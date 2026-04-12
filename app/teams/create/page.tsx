import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import CreateTeamForm from '@/components/teams/CreateTeamForm'

export default async function CreateTeamPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  // If user already has a team or a pending request, redirect
  const [{ data: profile }, { data: pendingReq }] = await Promise.all([
    supabase
      .from('users')
      .select('team_id')
      .eq('id', user.id)
      .single(),
    supabase
      .from('team_join_requests')
      .select('id')
      .eq('requester_user_id', user.id)
      .eq('status', 'pending')
      .limit(1),
  ])

  if (pendingReq && pendingReq.length > 0) {
    redirect('/teams')
  }

  if (profile?.team_id) {
    const { data: team } = await supabase
      .from('teams')
      .select('slug')
      .eq('id', profile.team_id)
      .single()
    redirect(team ? `/teams/${team.slug}` : '/teams')
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pb-14">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Create a Team</CardTitle>
            <CardDescription>
              Start a new team and invite others to join.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTeamForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
