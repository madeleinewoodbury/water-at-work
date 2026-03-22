type Props = { variant?: 'nav' | 'page' }

export default function BrandLogo({ variant = 'nav' }: Props) {
  if (variant === 'page') {
    return (
      <div className="flex items-center gap-2.5 text-3xl font-bold tracking-tight">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/water-glass.png" alt="Water glass" className="h-9 w-auto" />
        <span className="text-primary">WaW</span>
      </div>
    )
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/water-glass.png" alt="Water glass" className="h-[18px] w-auto" />
      <span className="text-primary">WaW</span>
    </>
  )
}
