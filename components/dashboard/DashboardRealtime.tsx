'use client'

import { useEffect, useState, useMemo, useCallback, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getDisplayName } from '@/lib/utils'
import { optOutUser, undoTeamOptOut } from '@/app/dashboard/actions'
import WaterInputCard from '@/components/dashboard/WaterInputCard'
import TeamProgressCard from '@/components/dashboard/TeamProgressCard'
import UserListCard from '@/components/dashboard/UserListCard'
import WowOverlay, { type WowEvent, pickRandomGif } from '@/components/dashboard/WowOverlay'

const CUTOFF_HOUR = 12

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
}

type OptOut = {
  id: string
  user_id: string
  opted_out_by: string | null
}

type PersonalEntry = {
  id: string
  ounces: number
  created_at: string
}

type Props = {
  initialData: {
    currentUserId: string
    today: string
    intakeLogs: IntakeLog[]
    teamUsers: TeamUser[]
    myEntries: PersonalEntry[]
    todayOptOuts: OptOut[]
  }
}

const MAX_WOW_QUEUE = 3

export default function DashboardRealtime({ initialData }: Props) {
  const { currentUserId, today } = initialData

  const [teamUsers, setTeamUsers] = useState(initialData.teamUsers)
  const [intakeLogs, setIntakeLogs] = useState(initialData.intakeLogs)
  const [myEntries, setMyEntries] = useState(initialData.myEntries)
  const [todayOptOuts, setTodayOptOuts] = useState(initialData.todayOptOuts)
  const [wowQueue, setWowQueue] = useState<WowEvent[]>([])
  const [isPending, startTransition] = useTransition()

  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, [])

  const [isPastCutoff, setIsPastCutoff] = useState(() => new Date().getHours() >= CUTOFF_HOUR)

  useEffect(() => {
    if (isPastCutoff) return
    const check = () => {
      if (new Date().getHours() >= CUTOFF_HOUR) setIsPastCutoff(true)
    }
    const interval = setInterval(check, 60_000)
    return () => clearInterval(interval)
  }, [isPastCutoff])

  // Build a lookup for user display names (for wow overlay)
  const userNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const u of teamUsers) {
      map[u.id] = getDisplayName(u)
    }
    return map
  }, [teamUsers])

  // Compute all derived dashboard data
  const dashboardData = useMemo(() => {
    const optOutMap = new Map(todayOptOuts.map((o) => [o.user_id, o]))
    const currentUserOptOut = optOutMap.get(currentUserId) ?? null

    const userTotals: Record<string, number> = {}
    for (const row of intakeLogs) {
      userTotals[row.user_id] = (userTotals[row.user_id] ?? 0) + row.ounces
    }

    const currentUser = teamUsers.find((u) => u.id === currentUserId)
    const personalTotal = userTotals[currentUserId] ?? 0
    const personalGoal = currentUser?.daily_goal ?? 32

    const activeUsers = teamUsers.filter((u) => !optOutMap.has(u.id))
    const teamTotal = activeUsers.reduce((s, u) => s + (userTotals[u.id] ?? 0), 0)
    const teamGoal = activeUsers.reduce((sum, u) => sum + (u.daily_goal ?? 32), 0)

    const userList = teamUsers
      .map((u) => {
        const optOut = optOutMap.get(u.id)
        return {
          id: u.id,
          displayName: getDisplayName(u),
          ounces: userTotals[u.id] ?? 0,
          dailyGoal: u.daily_goal ?? 32,
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

    return {
      personalTotal,
      personalGoal,
      teamTotal,
      teamGoal,
      activeUsers,
      userList,
      currentUserOptOut,
    }
  }, [intakeLogs, todayOptOuts, teamUsers, currentUserId])

  // Real-time event handlers
  const handleIntakeChange = useCallback(
    (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
      if (payload.eventType === 'INSERT') {
        const row = payload.new as unknown as IntakeLog
        setIntakeLogs((prev) => [...prev, row])
        if (row.user_id === currentUserId) {
          setMyEntries((prev) => [
            ...prev,
            { id: row.id, ounces: row.ounces, created_at: row.created_at },
          ])
        }
        // Trigger wow overlay
        setWowQueue((prev) => {
          if (prev.length >= MAX_WOW_QUEUE) return prev
          return [
            ...prev,
            {
              id: row.id,
              userName: userNameMap[row.user_id] ?? 'Someone',
              ounces: row.ounces,
              gif: pickRandomGif(),
            },
          ]
        })
      }

      if (payload.eventType === 'UPDATE') {
        const row = payload.new as unknown as IntakeLog
        setIntakeLogs((prev) => prev.map((l) => (l.id === row.id ? row : l)))
        if (row.user_id === currentUserId) {
          setMyEntries((prev) =>
            prev.map((e) => (e.id === row.id ? { ...e, ounces: row.ounces } : e))
          )
        }
      }

      if (payload.eventType === 'DELETE') {
        const old = payload.old as unknown as IntakeLog
        if (old.id) {
          setIntakeLogs((prev) => prev.filter((l) => l.id !== old.id))
          setMyEntries((prev) => prev.filter((e) => e.id !== old.id))
        }
      }
    },
    [currentUserId, userNameMap]
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

  const handleUserChange = useCallback(
    (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
      if (payload.eventType === 'UPDATE') {
        const updated = payload.new as unknown as TeamUser
        setTeamUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      }

      if (payload.eventType === 'INSERT') {
        const newUser = payload.new as unknown as TeamUser
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
    []
  )

  // Subscribe to real-time changes
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'intake_logs',
          filter: `date=eq.${today}`,
        },
        handleIntakeChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opt_outs',
        },
        handleOptOutChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        handleUserChange
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [today, handleIntakeChange, handleOptOutChange, handleUserChange])

  const handleOptOutUser = useCallback(
    (targetUserId: string) => {
      startTransition(async () => {
        await optOutUser(targetUserId, timezone)
      })
    },
    [timezone]
  )

  const handleUndoTeamOptOut = useCallback((optOutId: string) => {
    startTransition(async () => {
      await undoTeamOptOut(optOutId)
    })
  }, [])

  const handleWowDismiss = useCallback(() => {
    setWowQueue((prev) => prev.slice(1))
  }, [])

  return (
    <>
      <WaterInputCard
        personalTotal={dashboardData.personalTotal}
        dailyGoal={dashboardData.personalGoal}
        entries={myEntries}
        isOptedOut={!!dashboardData.currentUserOptOut}
        optOutId={dashboardData.currentUserOptOut?.id ?? null}
        optedOutByAnother={
          !!dashboardData.currentUserOptOut &&
          !!dashboardData.currentUserOptOut.opted_out_by &&
          dashboardData.currentUserOptOut.opted_out_by !== currentUserId
        }
      />
      <TeamProgressCard
        teamTotal={dashboardData.teamTotal}
        participantCount={dashboardData.activeUsers.length}
        totalMemberCount={teamUsers.length}
        teamGoal={dashboardData.teamGoal}
      />
      <UserListCard
        users={dashboardData.userList}
        currentUserId={currentUserId}
        isPastCutoff={isPastCutoff}
        isPending={isPending}
        onOptOutUser={handleOptOutUser}
        onUndoOptOut={handleUndoTeamOptOut}
      />
      <WowOverlay current={wowQueue[0] ?? null} onDismiss={handleWowDismiss} />
    </>
  )
}
