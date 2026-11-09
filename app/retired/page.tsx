import type { Metadata } from 'next'
import BrandLogo from '@/components/BrandLogo'

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
      <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 px-8 py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/wow/wow-1-optimized.gif"
          alt="Owen Wilson saying “wow”"
          width={498}
          height={280}
          className="mx-auto mb-5 aspect-[498/280] w-full max-w-xs rounded-xl bg-primary/10 object-cover"
        />
        <p className="text-sm font-medium text-muted-foreground">Together we drank</p>
        <p className="mt-1 text-4xl font-bold tracking-tight text-primary">778 liters</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          That&apos;s about 3,100 glasses of water, or five full bathtubs, across
          1,486 logs.
        </p>
      </div>

      <p className="mt-8 max-w-md text-lg text-muted-foreground">
        Thank you for staying hydrated. 💧
      </p>
    </main>
  )
}
