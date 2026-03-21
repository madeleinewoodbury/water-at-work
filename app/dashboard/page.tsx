import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Welcome back, <span className="font-medium text-zinc-900 dark:text-zinc-50">{user.email}</span>
      </p>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
        Water tracking coming soon.
      </p>
    </main>
  )
}
