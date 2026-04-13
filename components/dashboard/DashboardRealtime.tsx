'use client'

import { useEffect, useState, useMemo, useCallback, useTransition, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getTeamProgressPercent, getTeamStatus } from '@/lib/team-status'
import { getDisplayName } from '@/lib/utils'
import { TEAM_OPTOUT_CUTOFF_HOUR } from '@/lib/dashboard-constants'
import { optOutUser, undoTeamOptOut } from '@/app/dashboard/actions'
import WaterInputCard from '@/components/dashboard/WaterInputCard'
import TeamProgressCard from '@/components/dashboard/TeamProgressCard'
import UserListCard from '@/components/dashboard/UserListCard'
import WowOverlay, { type WowEvent, pickRandomGif } from '@/components/dashboard/WowOverlay'
import TeamsAnnouncementBanner from '@/components/dashboard/TeamsAnnouncementBanner'

type IntakeLog = {
  id: string
  user_id: string
  date: string
  ounces: number
  created_at: string
}

type TeamUser = {
  id: string
  email: string
  display_name: string | null
  daily_goal: number
  avatar_url: string | null
  is_active: boolean
}

type OptOut = {
  id: string
  user_id: string
  opted_out_by: string | null
}

type DailyGoalOverride = {
  id: string
  user_id: string
  date: string
  daily_goal: number
}

type Props = {
  initialData: {
    currentUserId: string
    today: string
    intakeLogs: IntakeLog[]
    teamUsers: TeamUser[]
    todayOptOuts: OptOut[]
    todayOverrides: DailyGoalOverride[]
    isCurrentUserActive: boolean
    teamId: string | null
    teamRole: string | null
    teamName: string | null
    teamSlug: string | null
  }
}

const MAX_WOW_QUEUE = 3

export default function DashboardRealtime({ initialData }: Props) {
  const { currentUserId, today, teamId, teamName, teamSlug } = initialData
  const hasTeam = !!teamId

  const [teamUsers, setTeamUsers] = useState(initialData.teamUsers)
  const [intakeLogs, setIntakeLogs] = useState(initialData.intakeLogs)
  const [todayOptOuts, setTodayOptOuts] = useState(initialData.todayOptOuts)
  const [todayOverrides, setTodayOverrides] = useState(initialData.todayOverrides)
  const [isCurrentUserActive, setIsCurrentUserActive] = useState(initialData.isCurrentUserActive)
  const [wowQueue, setWowQueue] = useState<WowEvent[]>([])
  const [teamActionError, setTeamActionError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Sync state when server re-fetches fresh data (e.g. after navigation)
  useEffect(() => {
    setTeamUsers(initialData.teamUsers)
    setIntakeLogs(initialData.intakeLogs)
    setTodayOptOuts(initialData.todayOptOuts)
    setTodayOverrides(initialData.todayOverrides)
  }, [initialData.teamUsers, initialData.intakeLogs, initialData.todayOptOuts, initialData.todayOverrides])

  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, [])

  const [currentHour, setCurrentHour] = useState(() => new Date().getHours())
  const [isPastCutoff, setIsPastCutoff] = useState(() => currentHour >= TEAM_OPTOUT_CUTOFF_HOUR)

  useEffect(() => {
    const check = () => {
      const hour = new Date().getHours()
      setCurrentHour((prev) => (prev === hour ? prev : hour))
      setIsPastCutoff((prev) => prev || hour >= TEAM_OPTOUT_CUTOFF_HOUR)
    }
    const interval = setInterval(check, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Keep a ref for user display names (for wow overlay) so intake handler
  // doesn't depend on it and won't cause subscription reconnects on profile changes
  const userNameMapRef = useRef<Record<string, string>>({})
  useEffect(() => {
    const map: Record<string, string> = {}
    for (const u of teamUsers) {
      map[u.id] = getDisplayName(u)
    }
    userNameMapRef.current = map
  }, [teamUsers])

  // Compute all derived dashboard data
  const dashboardData = useMemo(() => {
    const optOutMap = new Map(todayOptOuts.map((o) => [o.user_id, o]))
    const currentUserOptOut = optOutMap.get(currentUserId) ?? null

    // Build override lookup: user_id -> override row
    const overrideMap = new Map(todayOverrides.map((o) => [o.user_id, o]))
    const getEffectiveGoal = (u: TeamUser) =>
      overrideMap.get(u.id)?.daily_goal ?? u.daily_goal ?? 32

    const userTotals: Record<string, number> = {}
    for (const row of intakeLogs) {
      userTotals[row.user_id] = (userTotals[row.user_id] ?? 0) + row.ounces
    }

    const currentUser = teamUsers.find((u) => u.id === currentUserId)
    const personalTotal = userTotals[currentUserId] ?? 0
    const personalOverride = overrideMap.get(currentUserId)
    const personalGoal = currentUser ? getEffectiveGoal(currentUser) : 32
    const personalBaseGoal = currentUser?.daily_goal ?? 32

    const activeUsers = teamUsers.filter((u) => !optOutMap.has(u.id))
    const teamTotal = activeUsers.reduce((s, u) => s + (userTotals[u.id] ?? 0), 0)
    const teamGoal = activeUsers.reduce((sum, u) => sum + getEffectiveGoal(u), 0)
    const teamPercent = getTeamProgressPercent(teamTotal, teamGoal)
    const teamStatus = getTeamStatus(teamPercent, currentHour)

    const userList = teamUsers
      .map((u) => {
        const optOut = optOutMap.get(u.id)
        return {
          id: u.id,
          displayName: getDisplayName(u),
          ounces: userTotals[u.id] ?? 0,
          dailyGoal: getEffectiveGoal(u),
          avatarUrl: u.avatar_url ?? null,
          email: u.email,
          isOptedOut: !!optOut,
          optOutId: optOut?.id ?? null,
          optedOutBy: optOut?.opted_out_by ?? null,
        }
      })
      .sort((a, b) => {
        if (a.isOptedOut !== b.isOptedOut) return a.isOptedOut ? 1 : -1
        return b.ounces - a.ounces
      })

    const myEntries = intakeLogs
      .filter((l) => l.user_id === currentUserId)
      .map((l) => ({ id: l.id, ounces: l.ounces, created_at: l.created_at }))
      .sort((a, b) => a.created_at.localeCompare(b.created_at))

    return {
      personalTotal,
      personalGoal,
      personalBaseGoal,
      personalOverrideGoal: personalOverride?.daily_goal ?? null,
      personalOverrideId: personalOverride?.id ?? null,
      teamTotal,
      teamGoal,
      teamPercent,
      teamStatus,
      activeUsers,
      userList,
      currentUserOptOut,
      myEntries,
    }
  }, [intakeLogs, todayOptOuts, todayOverrides, teamUsers, currentUserId, currentHour])

  // Real-time event handlers
  const handleIntakeChange = useCallback(
    (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
      if (payload.eventType === 'INSERT') {
        const rawRow = payload.new as unknown as IntakeLog
        const row = { ...rawRow, ounces: Number(rawRow.ounces) }
        setIntakeLogs((prev) => [...prev, row])
        // Trigger wow overlay
        setWowQueue((prev) => {
          if (prev.length >= MAX_WOW_QUEUE) return prev
          return [
            ...prev,
            {
              id: row.id,
              userName: userNameMapRef.current[row.user_id] ?? 'Someone',
              ounces: row.ounces,
              gif: pickRandomGif(),
            },
          ]
        })
      }

      if (payload.eventType === 'UPDATE') {
        const rawRow = payload.new as unknown as IntakeLog
        const row = { ...rawRow, ounces: Number(rawRow.ounces) }
        setIntakeLogs((prev) => prev.map((l) => (l.id === row.id ? row : l)))
      }

      if (payload.eventType === 'DELETE') {
        const old = payload.old as unknown as IntakeLog
        if (old.id) {
          setIntakeLogs((prev) => prev.filter((l) => l.id !== old.id))
        }
      }
    },
    []
  )

  const handleOptOutChange = useCallback(
    (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
      if (payload.eventType === 'INSERT') {
        const row = payload.new as unknown as OptOut & { start_date: string; end_date: string }
        if (row.start_date <= today && row.end_date >= today) {
          setTodayOptOuts((prev) => [...prev, {
            id: row.id,
            user_id: row.user_id,
            opted_out_by: row.opted_out_by ?? null,
          }])
        }
      }

      if (payload.eventType === 'DELETE') {
        const old = payload.old as unknown as OptOut
        if (old.id) {
          setTodayOptOuts((prev) => prev.filter((o) => o.id !== old.id))
        }
      }
    },
    [today]
  )

  const handleOverrideChange = useCallback(
    (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
      if (payload.eventType === 'INSERT') {
        const rawRow = payload.new as unknown as DailyGoalOverride
        const row = { ...rawRow, daily_goal: Number(rawRow.daily_goal) }
        if (row.date === today) {
          setTodayOverrides((prev) => [...prev.filter((o) => o.user_id !== row.user_id), row])
        }
      }

      if (payload.eventType === 'UPDATE') {
        const rawRow = payload.new as unknown as DailyGoalOverride
        const row = { ...rawRow, daily_goal: Number(rawRow.daily_goal) }
        if (row.date === today) {
          setTodayOverrides((prev) => prev.map((o) => (o.id === row.id ? row : o)))
        }
      }

      if (payload.eventType === 'DELETE') {
        const old = payload.old as unknown as DailyGoalOverride
        if (old.id) {
          setTodayOverrides((prev) => prev.filter((o) => o.id !== old.id))
        }
      }
    },
    [today]
  )

  const handleUserChange = useCallback(
    (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
      if (payload.eventType === 'UPDATE') {
        const rawUpdated = payload.new as unknown as TeamUser
        const updated = { ...rawUpdated, daily_goal: Number(rawUpdated.daily_goal) }
        // Track current user's active status for the inactive banner
        if (updated.id === currentUserId) {
          setIsCurrentUserActive(updated.is_active)
        }
        if (!updated.is_active) {
          // User deactivated — remove from team list
          setTeamUsers((prev) => prev.filter((u) => u.id !== updated.id))
        } else {
          setTeamUsers((prev) => {
            const exists = prev.some((u) => u.id === updated.id)
            if (exists) return prev.map((u) => (u.id === updated.id ? updated : u))
            // User reactivated — add back to team list
            return [...prev, updated]
          })
        }
      }

      if (payload.eventType === 'INSERT') {
        const rawNewUser = payload.new as unknown as TeamUser
        const newUser = { ...rawNewUser, daily_goal: Number(rawNewUser.daily_goal) }
        if (!newUser.is_active) return
        setTeamUsers((prev) => {
          if (prev.some((u) => u.id === newUser.id)) return prev
          return [...prev, newUser]
        })
      }

      if (payload.eventType === 'DELETE') {
        const old = payload.old as unknown as TeamUser
        if (old.id) {
          setTeamUsers((prev) => prev.filter((u) => u.id !== old.id))
        }
      }
    },
    [currentUserId]
  )

  // Subscribe to real-time changes — scoped by team when user has one
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase.channel('dashboard-realtime')

    if (hasTeam && teamId) {
      // Team-scoped subscriptions
      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'intake_logs',
            filter: `team_id=eq.${teamId}`,
          },
          (payload) => {
            const row = payload.new as unknown as IntakeLog & { date?: string }
            // Only process today's events for dashboard state
            if (payload.eventType === 'INSERT' && row.date === today) {
              handleIntakeChange(payload as Parameters<typeof handleIntakeChange>[0])
            } else if (payload.eventType !== 'INSERT') {
              handleIntakeChange(payload as Parameters<typeof handleIntakeChange>[0])
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'opt_outs',
            filter: `team_id=eq.${teamId}`,
          },
          handleOptOutChange
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_goal_overrides',
            filter: `team_id=eq.${teamId}`,
          },
          (payload) => {
            const row = payload.new as unknown as DailyGoalOverride
            if (payload.eventType === 'DELETE' || row.date === today) {
              handleOverrideChange(payload as Parameters<typeof handleOverrideChange>[0])
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
            filter: `team_id=eq.${teamId}`,
          },
          handleUserChange
        )
    } else {
      // Personal-only subscriptions (no team)
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'intake_logs',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          const row = payload.new as unknown as IntakeLog & { date?: string }
          if (payload.eventType === 'INSERT' && row.date === today) {
            handleIntakeChange(payload as Parameters<typeof handleIntakeChange>[0])
          } else if (payload.eventType !== 'INSERT') {
            handleIntakeChange(payload as Parameters<typeof handleIntakeChange>[0])
          }
        }
      )
    }

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [today, teamId, hasTeam, currentUserId, handleIntakeChange, handleOptOutChange, handleOverrideChange, handleUserChange])

  const handleOptOutUser = useCallback(
    (targetUserId: string) => {
      startTransition(async () => {
        const result = await optOutUser(targetUserId, timezone)
        if (result?.error) {
          setTeamActionError(result.error)
          return
        }
        setTeamActionError(null)
      })
    },
    [timezone]
  )

  const handleUndoTeamOptOut = useCallback((optOutId: string) => {
    startTransition(async () => {
      const result = await undoTeamOptOut(optOutId)
      if (result?.error) {
        setTeamActionError(result.error)
        return
      }
      setTeamActionError(null)
    })
  }, [])

  const handleWowDismiss = useCallback(() => {
    setWowQueue((prev) => prev.slice(1))
  }, [])

  return (
    <>
      <TeamsAnnouncementBanner />
      {!isCurrentUserActive && (
        <div className="col-span-full rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
          You&apos;ve been marked inactive due to 7 days without logging. Log water to rejoin the team.
        </div>
      )}
      {teamActionError && (
        <div className="col-span-full rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {teamActionError}
        </div>
      )}
      <WaterInputCard
        personalTotal={dashboardData.personalTotal}
        dailyGoal={dashboardData.personalGoal}
        baseGoal={dashboardData.personalBaseGoal}
        overrideGoal={dashboardData.personalOverrideGoal}
        overrideId={dashboardData.personalOverrideId}
        entries={dashboardData.myEntries}
        isOptedOut={!!dashboardData.currentUserOptOut}
        optOutId={dashboardData.currentUserOptOut?.id ?? null}
        optedOutByAnother={
          !!dashboardData.currentUserOptOut &&
          !!dashboardData.currentUserOptOut.opted_out_by &&
          dashboardData.currentUserOptOut.opted_out_by !== currentUserId
        }
      />
      {hasTeam ? (
        <>
          <TeamProgressCard
            teamTotal={dashboardData.teamTotal}
            teamPercent={dashboardData.teamPercent}
            teamStatus={dashboardData.teamStatus}
            participantCount={dashboardData.activeUsers.length}
            totalMemberCount={teamUsers.length}
            teamGoal={dashboardData.teamGoal}
            teamName={teamName}
            teamSlug={teamSlug}
          />
          <UserListCard
            users={dashboardData.userList}
            currentUserId={currentUserId}
            isPastCutoff={isPastCutoff}
            isPending={isPending}
            onOptOutUser={handleOptOutUser}
            onUndoOptOut={handleUndoTeamOptOut}
          />
        </>
      ) : (
        <div className="col-span-full rounded-lg border border-border bg-card px-6 py-8 text-center">
          <p className="text-muted-foreground">
            Join a team to see team progress and collaborate with others.
          </p>
          <Link
            href="/teams"
            className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
          >
            Browse Teams
          </Link>
        </div>
      )}
      <WowOverlay current={wowQueue[0] ?? null} onDismiss={handleWowDismiss} />
    </>
  )
}
