import type { Metadata } from 'next'
import { Suspense } from 'react'
import BrandLogo from '@/components/BrandLogo'
import StatsReveal from '@/components/StatsReveal'
import RandomWowGif, { WowGifPlaceholder } from '@/components/RandomWowGif'

export const metadata: Metadata = {
  title: 'WaW — Water at Work has been retired',
  description: 'Water at Work has been retired. Thank you for staying hydrated!',
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

      {/* Final all-time totals, taken from the database before shutdown. */}
      <StatsReveal>
        <p className="text-sm font-medium text-muted-foreground">Together we drank</p>
        <p className="mt-1 text-4xl font-bold tracking-tight text-primary">778 liters</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          That&apos;s about 3,100 glasses of water, or five full bathtubs, across
          1,486 logs.
        </p>
        <Suspense fallback={<WowGifPlaceholder />}>
          <RandomWowGif />
        </Suspense>
      </StatsReveal>

      <p className="mt-8 max-w-md text-lg text-muted-foreground">
        Thank you for staying hydrated. 💧
      </p>
    </main>
  )
}
