import type { Metadata } from 'next'
import BrandLogo from '@/components/BrandLogo'

export const metadata: Metadata = {
  title: 'WaW — Water at Work has been retired',
  description: 'Water at Work has been retired. Thanks for staying hydrated!',
}

// Static splash page. Must not import anything that talks to Supabase.
export default function RetiredPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
      <BrandLogo variant="page" />

      <h1 className="mt-10 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
        <span className="text-foreground">Water at Work</span>
        <br />
        <span className="bg-gradient-to-r from-primary to-[oklch(0.50_0.18_196)] dark:to-[oklch(0.65_0.18_192)] bg-clip-text text-transparent">
          has been retired.
        </span>
      </h1>

      <p className="mt-6 max-w-md text-lg text-muted-foreground">
        Thanks for staying hydrated with us. Keep that water bottle close. 💧
      </p>
    </main>
  )
}
