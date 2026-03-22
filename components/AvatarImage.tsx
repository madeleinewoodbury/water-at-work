'use client'

import { useState } from 'react'

type Props = {
  src: string | null
  fallback: string
  size?: number
}

export default function AvatarImage({ src, fallback, size = 32 }: Props) {
  const [imgError, setImgError] = useState(false)

  if (!src || imgError) {
    return <span>{fallback}</span>
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className="size-full rounded-full object-cover"
      onError={() => setImgError(true)}
    />
  )
}
