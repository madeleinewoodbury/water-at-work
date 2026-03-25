export default function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between px-6">
        <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
        <div className="flex items-center gap-1">
          <div className="h-7 w-20 animate-pulse rounded-lg bg-muted" />
          <div className="h-7 w-16 animate-pulse rounded-lg bg-muted" />
          <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
        </div>
      </nav>
    </header>
  )
}
