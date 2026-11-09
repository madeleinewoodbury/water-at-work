// Water at Work is being retired. From RETIREMENT_AT onwards, proxy.ts serves
// the static splash page for every route and never touches Supabase.
//
// Defaults to the start of December 1, 2026 (UTC). Set the RETIREMENT_AT env
// var (any ISO 8601 date) to move it, e.g. to a past date on a preview deploy.
const DEFAULT_RETIREMENT_AT = '2026-12-01T00:00:00Z'

// Path of the splash page. It can always be visited directly to preview it.
export const RETIRED_PATH = '/retired'

// Request header the proxy sets when serving the splash page, so the root
// layout can skip anything that would call Supabase (e.g. the Navbar).
export const RETIRED_HEADER = 'x-waw-retired'

export function getRetirementDate(): Date {
  const date = new Date(process.env.RETIREMENT_AT ?? DEFAULT_RETIREMENT_AT)
  return Number.isNaN(date.getTime()) ? new Date(DEFAULT_RETIREMENT_AT) : date
}

export function isRetired(now: Date = new Date()): boolean {
  return now.getTime() >= getRetirementDate().getTime()
}
