'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  defaultFrom: string
  defaultTo: string
}

export default function HistoryFilter({ defaultFrom, defaultTo }: Props) {
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [excludeWeekends, setExcludeWeekends] = useState(
    () => searchParams.get('show_weekends') !== '1'
  )

  const today = new Date().toISOString().split('T')[0]

  function navigate(newFrom: string, newTo: string, newExclude: boolean) {
    const params = new URLSearchParams()
    params.set('from', newFrom)
    params.set('to', newTo)
    const tab = searchParams.get('tab')
    if (tab) params.set('tab', tab)
    if (!newExclude) params.set('show_weekends', '1')
    router.push(`/history?${params.toString()}`)
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!from || !to) {
      setError('Both dates are required')
      return
    }
    if (from > to) {
      setError('"From" date must be before "To" date')
      return
    }

    navigate(from, to, excludeWeekends)
  }

  function handleExcludeChange(checked: boolean) {
    setExcludeWeekends(checked)
    if (from && to && from <= to) {
      navigate(from, to, checked)
    }
  }

  return (
    <Card size="sm">
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="date"
                max={to || today}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="date"
                min={from}
                max={today}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <Button type="submit">Filter</Button>
            {error && <p className="w-full text-sm text-destructive">{error}</p>}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Switch
              size="sm"
              checked={excludeWeekends}
              onCheckedChange={handleExcludeChange}
            />
            Exclude weekends
          </label>
        </form>
      </CardContent>
    </Card>
  )
}
