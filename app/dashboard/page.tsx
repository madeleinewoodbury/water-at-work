import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>
              Welcome back 👋
            </CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="text-5xl">💧</span>
              <p className="text-sm text-muted-foreground">
                Water tracking is coming soon. Check back shortly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
