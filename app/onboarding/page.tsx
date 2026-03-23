import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGravatarUrl } from '@/lib/gravatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import OnboardingForm from '@/components/auth/onboarding-form'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single()

  if (profile?.display_name) redirect('/dashboard')

  const githubAvatarUrl =
    user.app_metadata?.provider === 'github'
      ? (user.user_metadata?.avatar_url as string | undefined)
      : undefined

  const gravatarUrl = user.email ? getGravatarUrl(user.email, 200) : undefined

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pb-14">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Welcome to Water at Work! 💧</CardTitle>
            <CardDescription>
              Let&apos;s set up your profile so your team knows who&apos;s staying hydrated.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <OnboardingForm githubAvatarUrl={githubAvatarUrl} gravatarUrl={gravatarUrl} error={error} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
