export type TeamStatus = {
  emoji: string
  label: string
  colorClass: string
}

const WORKDAY_START_HOUR = 9
const WORKDAY_HOURS = 8

function getCompletedWorkdayHours(currentHour: number): number {
  if (currentHour < WORKDAY_START_HOUR) return 0
  if (currentHour >= WORKDAY_START_HOUR + WORKDAY_HOURS) return WORKDAY_HOURS
  return currentHour - WORKDAY_START_HOUR
}

function getExpectedProgressPercent(currentHour: number): number {
  const completedHours = getCompletedWorkdayHours(currentHour)
  return Math.round((completedHours / WORKDAY_HOURS) * 100)
}

export function getTeamProgressPercent(teamTotal: number, teamGoal: number): number {
  if (teamGoal <= 0) return 0
  return Math.max(0, Math.round((teamTotal / teamGoal) * 100))
}

export function getTeamStatus(teamPercent: number, currentHour: number): TeamStatus {
  if (teamPercent >= 120) {
    return { emoji: '🌊', label: 'flooded!', colorClass: 'text-orange-700 dark:text-orange-400' }
  }
  if (teamPercent >= 110) {
    return {
      emoji: '🚀',
      label: 'above & beyond',
      colorClass: 'text-emerald-700 dark:text-emerald-400',
    }
  }
  if (teamPercent >= 100) {
    return { emoji: '🏆', label: 'crushed it!', colorClass: 'text-green-700 dark:text-green-400' }
  }
  const expectedPercent = getExpectedProgressPercent(currentHour)
  const delta = teamPercent - expectedPercent

  if (delta >= 15) {
    return {
      emoji: '⚡',
      label: 'ahead of schedule',
      colorClass: 'text-sky-700 dark:text-sky-400',
    }
  }
  if (delta >= -10) {
    return { emoji: '💧', label: 'on track', colorClass: 'text-sky-700 dark:text-sky-400' }
  }
  if (delta >= -25) {
    return { emoji: '🐢', label: 'behind', colorClass: 'text-amber-700 dark:text-amber-400' }
  }
  return { emoji: '💤', label: 'slacking', colorClass: 'text-muted-foreground' }
}

export function getTeamCelebrationText(teamPercent: number): string {
  if (teamPercent >= 120) return `${teamPercent}% - unstoppable!`
  if (teamPercent > 100) return `${teamPercent}% - above and beyond!`
  if (teamPercent === 100) return 'Goal reached!'
  return `${teamPercent}% of team goal`
}
