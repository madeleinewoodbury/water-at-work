'use client'

import { useMemo, useState } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import TeamCard from '@/components/teams/TeamCard'

type Team = {
  id: string
  name: string
  slug: string
  created_at: string
  memberCount: number
}

type Props = {
  teams: Team[]
  userTeamId: string | null
  pendingTeamId: string | null
  pendingRequestId: string | null
}

const PAGE_SIZE = 12

export default function TeamsBrowser({
  teams,
  userTeamId,
  pendingTeamId,
  pendingRequestId,
}: Props) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return teams
    return teams.filter((t) => t.name.toLowerCase().includes(q))
  }, [teams, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageTeams = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {pendingRequestId && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
          You have a pending request to join a team.
        </div>
      )}

      {teams.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-6 py-8 text-center text-muted-foreground">
          No teams yet. Be the first to create one!
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search teams..."
              className="h-10 pl-9"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-border bg-card px-6 py-8 text-center text-muted-foreground">
              No teams match &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pageTeams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    isUserTeam={team.id === userTeamId}
                    isPending={team.id === pendingTeamId}
                    pendingRequestId={pendingRequestId}
                    canJoin={!userTeamId && !pendingTeamId}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                    Prev
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
