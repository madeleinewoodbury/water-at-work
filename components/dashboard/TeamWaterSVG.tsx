'use client'

import { useEffect, useState } from 'react'

type TeamWaterSVGProps = {
  teamTotal: number
  teamGoal: number
}

// Glass geometry constants
const SVG_W = 140
const SVG_H = 160
const GLASS_TOP = 15
const GLASS_BOTTOM = 145
const GOAL_Y = GLASS_TOP + 12 // goal line sits just below the rim
const FILL_ZONE = GLASS_BOTTOM - GOAL_Y // 0-100% fills this range
const TOP_HALF_W = 45 // half-width at top
const BOT_HALF_W = 35 // half-width at bottom
const CENTER_X = 65 // shifted slightly left to make room for "Goal" label

// Glass outline path (trapezoid with rounded bottom)
const GLASS_PATH = [
  `M ${CENTER_X - TOP_HALF_W} ${GLASS_TOP}`,
  `L ${CENTER_X - BOT_HALF_W} ${GLASS_BOTTOM - 6}`,
  `Q ${CENTER_X - BOT_HALF_W} ${GLASS_BOTTOM} ${CENTER_X - BOT_HALF_W + 6} ${GLASS_BOTTOM}`,
  `L ${CENTER_X + BOT_HALF_W - 6} ${GLASS_BOTTOM}`,
  `Q ${CENTER_X + BOT_HALF_W} ${GLASS_BOTTOM} ${CENTER_X + BOT_HALF_W} ${GLASS_BOTTOM - 6}`,
  `L ${CENTER_X + TOP_HALF_W} ${GLASS_TOP}`,
].join(' ')

// Closed version for clip path
const CLIP_PATH = GLASS_PATH + ' Z'

// Interpolate width at a given Y position within the trapezoid
function widthAtY(y: number) {
  const glassHeight = GLASS_BOTTOM - GLASS_TOP
  const t = (y - GLASS_TOP) / glassHeight
  return 2 * (TOP_HALF_W + t * (BOT_HALF_W - TOP_HALF_W))
}

export default function TeamWaterSVG({ teamTotal, teamGoal }: TeamWaterSVGProps) {
  const [mounted, setMounted] = useState(false)

  const fillPercent = teamGoal > 0 ? Math.min(teamTotal / teamGoal, 1) : 0
  const percentage = teamGoal > 0 ? Math.round((teamTotal / teamGoal) * 100) : 0

  // Trigger entrance animation after mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Fill dimensions: 100% = reaches goal line, capped there
  const fillHeight = mounted ? fillPercent * FILL_ZONE : 0
  const fillY = GLASS_BOTTOM - fillHeight

  // Goal line geometry
  const goalLineWidth = widthAtY(GOAL_Y)
  const goalLineX1 = CENTER_X - goalLineWidth / 2
  const goalLineX2 = CENTER_X + goalLineWidth / 2

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="h-48 w-auto md:h-64"
        role="img"
        aria-label={`Team water progress: ${teamTotal} of ${teamGoal} ounces (${percentage}%)`}
      >
        <defs>
          <clipPath id="glass-clip">
            <path d={CLIP_PATH} />
          </clipPath>
          <linearGradient id="water-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Water fill (clipped to glass shape) */}
        <g clipPath="url(#glass-clip)">
          <rect
            x={CENTER_X - TOP_HALF_W}
            y={fillY}
            width={TOP_HALF_W * 2}
            height={fillHeight}
            fill="url(#water-gradient)"
            style={{
              transition: 'y 0.8s ease-out, height 0.8s ease-out',
            }}
          />
        </g>

        {/* Glass outline */}
        <path
          d={GLASS_PATH}
          fill="none"
          stroke="var(--muted-foreground)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />

        {/* Goal line (slightly below rim) */}
        <line
          x1={goalLineX1}
          y1={GOAL_Y}
          x2={goalLineX2}
          y2={GOAL_Y}
          stroke="var(--muted-foreground)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.6"
        />

        {/* Goal label */}
        <text
          x={goalLineX2 + 5}
          y={GOAL_Y + 4}
          fill="var(--muted-foreground)"
          fontSize="9"
          opacity="0.7"
        >
          Goal
        </text>
      </svg>

      {/* Numeric summary */}
      <div className="text-center">
        <p className="text-2xl font-bold tabular-nums text-primary">
          {teamTotal} <span className="text-base font-normal text-muted-foreground">/ {teamGoal} oz</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {percentage}% of team goal
        </p>
      </div>
    </div>
  )
}
