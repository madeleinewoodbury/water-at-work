import { connection } from 'next/server'

// The same Owen Wilson GIFs the dashboard's WowOverlay uses.
const WOW_GIFS = [
  { src: '/wow/wow-1-optimized.gif', width: 498, height: 280 },
  { src: '/wow/wow-2-optimized.gif', width: 382, height: 498 },
  { src: '/wow/wow-3-optimized.gif', width: 498, height: 281 },
  { src: '/wow/wow-4-optimized.gif', width: 498, height: 210 },
  { src: '/wow/wow-5-optimized.gif', width: 498, height: 280 },
]

function pickRandomGif() {
  return WOW_GIFS[Math.floor(Math.random() * WOW_GIFS.length)]
}

const imgClassName = 'mx-auto mb-5 h-44 w-auto max-w-full rounded-xl bg-primary/10 object-contain'

// Picks a new GIF on every request. Render inside <Suspense>.
export default async function RandomWowGif() {
  await connection()
  const gif = pickRandomGif()

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={gif.src}
      alt="Owen Wilson saying “wow”"
      width={gif.width}
      height={gif.height}
      className={imgClassName}
    />
  )
}

export function WowGifPlaceholder() {
  return <div aria-hidden="true" className="mx-auto mb-5 h-44 w-72 max-w-full rounded-xl bg-primary/10" />
}
