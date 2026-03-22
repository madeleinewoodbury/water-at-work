import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { completeOnboarding } from '@/app/onboarding/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

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
            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <form action={completeOnboarding} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="display_name">Your name</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  type="text"
                  required
                  maxLength={50}
                  autoComplete="nickname"
                  placeholder="What should your teammates call you?"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="daily_goal">Daily water goal (oz)</Label>
                <Input
                  id="daily_goal"
                  name="daily_goal"
                  type="number"
                  required
                  min={1}
                  defaultValue={32}
                />
                <p className="text-xs text-muted-foreground">
                  Default is 32 oz — adjust to match your goal.
                </p>
              </div>

              <Button type="submit" className="mt-1 w-full">
                Get started
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
