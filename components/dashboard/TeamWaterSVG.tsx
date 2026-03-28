'use client'

import { useEffect, useState } from 'react'
import { getTeamCelebrationText, getTeamProgressPercent } from '@/lib/team-status'
import { formatOneDecimal } from '@/lib/utils'

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
const OVERFLOW_ZONE = GOAL_Y - GLASS_TOP // 12px above goal line to rim
const HALF_Y = GLASS_BOTTOM - 0.5 * FILL_ZONE // 50% mark = Y 86
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

// Bubble configuration for celebration
const BUBBLES = [
  { cx: CENTER_X - 15, r: 2.5, duration: 3, delay: 0 },
  { cx: CENTER_X + 10, r: 2, duration: 2.5, delay: 0.8 },
  { cx: CENTER_X - 5, r: 3, duration: 3.5, delay: 0.3 },
  { cx: CENTER_X + 20, r: 1.5, duration: 2.8, delay: 1.2 },
  { cx: CENTER_X, r: 2, duration: 3.2, delay: 0.6 },
]

export default function TeamWaterSVG({ teamTotal, teamGoal }: TeamWaterSVGProps) {
  const [mounted, setMounted] = useState(false)

  const fillPercent = teamGoal > 0 ? teamTotal / teamGoal : 0
  const percentage = getTeamProgressPercent(teamTotal, teamGoal)
  const goalReached = percentage >= 100

  // Trigger entrance animation after mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Regular fill: 0-100% maps to FILL_ZONE (bottom to goal line)
  const regularFill = mounted ? Math.min(fillPercent, 1) * FILL_ZONE : 0
  // Overflow: above 100% fills the 12px zone above goal line. 150% = full to rim.
  const overflowFill = mounted
    ? Math.min(Math.max(fillPercent - 1, 0) * 2, 1) * OVERFLOW_ZONE
    : 0
  const totalFillHeight = regularFill + overflowFill
  const fillY = GLASS_BOTTOM - totalFillHeight

  // Goal line geometry
  const goalLineWidth = widthAtY(GOAL_Y)
  const goalLineX1 = CENTER_X - goalLineWidth / 2
  const goalLineX2 = CENTER_X + goalLineWidth / 2

  // Halfway marker geometry
  const halfLineWidth = widthAtY(HALF_Y)
  const halfLineX1 = CENTER_X - halfLineWidth / 2
  const halfLineX2 = CENTER_X + halfLineWidth / 2

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
          <linearGradient id="overflow-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.75" />
          </linearGradient>
          {goalReached && (
            <filter id="gold-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          )}
          <style>{`
            @keyframes bubble-rise {
              0% { transform: translateY(0); opacity: 0.6; }
              50% { opacity: 0.4; }
              100% { transform: translateY(-90px); opacity: 0; }
            }
            @keyframes shimmer {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 0.7; }
            }
          `}</style>
        </defs>

        {/* Water fill (clipped to glass shape) */}
        <g clipPath="url(#glass-clip)">
          {/* Main water fill */}
          <rect
            x={CENTER_X - TOP_HALF_W}
            y={fillY}
            width={TOP_HALF_W * 2}
            height={totalFillHeight}
            fill="url(#water-gradient)"
            style={{
              transition: 'y 0.8s ease-out, height 0.8s ease-out',
            }}
          />

          {/* Overflow band above goal line — brighter shade */}
          {overflowFill > 0 && (
            <rect
              x={CENTER_X - TOP_HALF_W}
              y={fillY}
              width={TOP_HALF_W * 2}
              height={overflowFill}
              fill="url(#overflow-gradient)"
              style={{
                transition: 'y 0.8s ease-out, height 0.8s ease-out',
              }}
            />
          )}

          {/* Shimmer line at water surface */}
          {goalReached && (
            <rect
              x={CENTER_X - TOP_HALF_W}
              y={fillY}
              width={TOP_HALF_W * 2}
              height={2}
              fill="white"
              opacity="0.4"
              style={{ animation: 'shimmer 2s ease-in-out infinite' }}
            />
          )}

          {/* Celebration bubbles */}
          {goalReached &&
            BUBBLES.map((b, i) => (
              <circle
                key={i}
                cx={b.cx}
                cy={GLASS_BOTTOM - 10}
                r={b.r}
                fill="white"
                opacity="0.5"
                style={{
                  animation: `bubble-rise ${b.duration}s ease-out ${b.delay}s infinite`,
                }}
              />
            ))}
        </g>

        {/* Glass outline */}
        <path
          d={GLASS_PATH}
          fill="none"
          stroke={goalReached ? 'oklch(0.75 0.15 85)' : 'var(--muted-foreground)'}
          strokeWidth={goalReached ? 2.5 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={goalReached ? 0.8 : 0.5}
          filter={goalReached ? 'url(#gold-glow)' : undefined}
          style={{ transition: 'stroke 0.5s, opacity 0.5s' }}
        />

        {/* Goal line (slightly below rim) */}
        <line
          x1={goalLineX1}
          y1={GOAL_Y}
          x2={goalLineX2}
          y2={GOAL_Y}
          stroke={goalReached ? 'oklch(0.75 0.15 85)' : 'var(--muted-foreground)'}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.6"
          style={{ transition: 'stroke 0.5s' }}
        />

        {/* Goal label */}
        <text
          x={goalLineX2 + 5}
          y={GOAL_Y + 4}
          fill={goalReached ? 'oklch(0.55 0.15 85)' : 'var(--muted-foreground)'}
          fontSize="10"
          style={{ transition: 'fill 0.5s' }}
        >
          Goal
        </text>

        {/* 50% halfway marker */}
        <line
          x1={halfLineX1}
          y1={HALF_Y}
          x2={halfLineX2}
          y2={HALF_Y}
          stroke="var(--muted-foreground)"
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.35"
        />
        <text
          x={halfLineX2 + 5}
          y={HALF_Y + 4}
          fill="var(--muted-foreground)"
          fontSize="8"
          opacity="0.5"
        >
          50%
        </text>
      </svg>

      {/* Numeric summary */}
      <div className="text-center">
        <p className="text-2xl font-bold tabular-nums text-primary">
          {formatOneDecimal(teamTotal)} <span className="text-base font-normal text-muted-foreground">/ {formatOneDecimal(teamGoal)} oz</span>
        </p>
        <p className={`text-sm ${goalReached ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
          {getTeamCelebrationText(percentage)}
        </p>
      </div>
    </div>
  )
}
