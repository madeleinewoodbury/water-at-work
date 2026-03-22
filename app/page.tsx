import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pb-14 text-center">
      {/* eyebrow */}
      <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        💧 Your hydration companion
      </span>

      {/* headline */}
      <h1 className="max-w-2xl text-5xl font-bold tracking-tight sm:text-6xl">
        <span className="bg-gradient-to-r from-primary to-[oklch(0.50_0.18_196)] dark:to-[oklch(0.65_0.18_192)] bg-clip-text text-transparent">
          Stay hydrated
        </span>
        <br />
        <span className="text-foreground">at work.</span>
      </h1>

      {/* subtext */}
      <p className="mt-6 max-w-md text-lg text-muted-foreground">
        WaW  helps you hit your daily water goal and build the kind of habits
        that keep you sharp — one glass at a time.
      </p>

      {/* CTAs */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/sign-up"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
        >
          Get started
        </Link>
        <Link
          href="/sign-in"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-8 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Sign in
        </Link>
      </div>
    </main>
  )
}
