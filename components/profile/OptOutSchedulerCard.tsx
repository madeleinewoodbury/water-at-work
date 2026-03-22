'use client'

import { useState, useTransition } from 'react'
import { addOptOut, deleteOptOut } from '@/app/profile/actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type OptOut = { id: string; start_date: string; end_date: string }

type Props = { scheduledOptOuts: OptOut[] }

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  return start === end ? fmt(start) : `${fmt(start)} – ${fmt(end)}`
}

export default function OptOutSchedulerCard({ scheduledOptOuts }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await addOptOut(null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess('Opt-out scheduled')
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  function handleDelete(id: string) {
    const fd = new FormData()
    fd.set('id', id)
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await deleteOptOut(null, fd)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability</CardTitle>
        <CardDescription>Opt out of team tracking on specific dates.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="opt-start">
                From
              </label>
              <Input
                id="opt-start"
                type="date"
                name="start_date"
                min={today}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="opt-end">
                To
              </label>
              <Input
                id="opt-end"
                type="date"
                name="end_date"
                min={today}
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={isPending} size="sm">
            {isPending ? 'Scheduling…' : 'Schedule Opt-Out'}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-primary">{success}</p>}
        </form>

        <div className="border-t border-border pt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Upcoming opt-outs</p>
          {scheduledOptOuts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming opt-outs scheduled.</p>
          ) : (
            <ul className="space-y-1.5">
              {scheduledOptOuts.map((o) => (
                <li key={o.id} className="flex items-center justify-between text-sm">
                  <span>{formatDateRange(o.start_date, o.end_date)}</span>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(o.id)}
                    className="text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive disabled:opacity-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
