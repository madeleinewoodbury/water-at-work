'use client'

import { useRef, useState, useTransition } from 'react'
import { Pencil, Trash2, PencilLine } from 'lucide-react'
import {
  logIntake,
  updateIntake,
  deleteIntake,
  optOutToday,
  optBackIn,
  setDailyGoalOverride,
  clearDailyGoalOverride,
} from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const PRESETS = [4, 8, 12, 16, 24]

type Entry = { id: string; ounces: number; created_at: string }

type Props = {
  personalTotal: number
  dailyGoal: number
  baseGoal: number
  overrideGoal: number | null
  overrideId: string | null
  entries: Entry[]
  isOptedOut: boolean
  optOutId: string | null
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function WaterInputCard({
  personalTotal,
  dailyGoal,
  baseGoal,
  overrideGoal,
  overrideId,
  entries,
  isOptedOut,
  optOutId,
}: Props) {
  const [ounces, setOunces] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const [showOverrideForm, setShowOverrideForm] = useState(false)
  const [overrideValue, setOverrideValue] = useState('')
  const [overrideError, setOverrideError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await logIntake(null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setError(null)
        setOunces('')
        formRef.current?.reset()
      }
    })
  }

  function handleUpdate(entryId: string) {
    const fd = new FormData()
    fd.set('id', entryId)
    fd.set('ounces', editValue)
    startTransition(async () => {
      const result = await updateIntake(null, fd)
      if (result?.error) {
        setEditError(result.error)
      } else {
        setEditError(null)
        setEditingId(null)
        setEditValue('')
      }
    })
  }

  function handleDelete(entryId: string) {
    const fd = new FormData()
    fd.set('id', entryId)
    startTransition(async () => {
      const result = await deleteIntake(null, fd)
      if (result?.error) setEditError(result.error)
    })
  }

  function handleOptOut() {
    startTransition(async () => {
      await optOutToday()
    })
  }

  function handleOptBackIn(id: string) {
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      await optBackIn(null, fd)
    })
  }

  function handleSetOverride() {
    const fd = new FormData()
    fd.set('daily_goal', overrideValue)
    startTransition(async () => {
      const result = await setDailyGoalOverride(null, fd)
      if (result?.error) {
        setOverrideError(result.error)
      } else {
        setOverrideError(null)
        setShowOverrideForm(false)
        setOverrideValue('')
      }
    })
  }

  function handleClearOverride() {
    if (!overrideId) return
    const fd = new FormData()
    fd.set('id', overrideId)
    startTransition(async () => {
      const result = await clearDailyGoalOverride(null, fd)
      if (result?.error) {
        setOverrideError(result.error)
      } else {
        setOverrideError(null)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Water Intake</CardTitle>
        <CardDescription>
          {showOverrideForm ? (
            <span className="flex items-center gap-2">
              <span>Goal today:</span>
              <Input
                type="number"
                min={1}
                placeholder={String(baseGoal)}
                value={overrideValue}
                onChange={(e) => setOverrideValue(e.target.value)}
                className="h-6 w-20 text-xs"
              />
              <span className="text-muted-foreground">oz</span>
              <Button
                size="sm"
                className="h-6 px-2 text-xs"
                disabled={isPending || !overrideValue}
                onClick={handleSetOverride}
              >
                Save
              </Button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setShowOverrideForm(false)
                  setOverrideValue('')
                  setOverrideError(null)
                }}
                className="cursor-pointer text-xs text-muted-foreground underline underline-offset-2 disabled:opacity-50"
              >
                Cancel
              </button>
              {overrideError && <span className="text-xs text-destructive">{overrideError}</span>}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span>
                Your total today:{' '}
                <span className="font-semibold text-foreground">{personalTotal} oz</span>
                <span className="text-muted-foreground"> / {dailyGoal} oz goal</span>
              </span>
              {overrideGoal !== null ? (
                <>
                  <span className="text-xs text-muted-foreground">(default: {baseGoal} oz)</span>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleClearOverride}
                    className="cursor-pointer text-xs text-primary underline underline-offset-2 disabled:opacity-50"
                  >
                    Reset
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setShowOverrideForm(true)}
                  className="cursor-pointer text-muted-foreground/60 hover:text-foreground disabled:opacity-50"
                  title="Adjust today's goal"
                >
                  <PencilLine className="size-3" />
                </button>
              )}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isOptedOut && (
          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            <span>You are sitting out today.</span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => optOutId && handleOptBackIn(optOutId)}
              className="cursor-pointer text-primary underline underline-offset-2 disabled:opacity-50"
            >
              Opt back in
            </button>
          </div>
        )}
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((oz) => (
              <Button
                key={oz}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOunces(String(oz))}
                aria-pressed={ounces === String(oz)}
              >
                {oz} oz
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              name="ounces"
              placeholder="Custom amount (oz)"
              min={1}
              value={ounces}
              onChange={(e) => setOunces(e.target.value)}
            />
            <Button type="submit" disabled={isPending || !ounces}>
              {isPending ? 'Logging…' : 'Log'}
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>

        {entries.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Today&apos;s entries</p>
            <ul className="space-y-1">
              {entries.map((entry) =>
                editingId === entry.id ? (
                  <li key={entry.id} className="flex items-center gap-2 py-1">
                    <Input
                      type="number"
                      min={1}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-7 w-20 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">oz</span>
                    <Button
                      size="sm"
                      disabled={isPending || !editValue}
                      onClick={() => handleUpdate(entry.id)}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => {
                        setEditingId(null)
                        setEditValue('')
                        setEditError(null)
                      }}
                    >
                      Cancel
                    </Button>
                  </li>
                ) : (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between py-1 text-sm text-muted-foreground"
                  >
                    <span>{entry.ounces} oz</span>
                    <div className="flex items-center gap-1">
                      <span>{formatTime(entry.created_at)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={isPending}
                        onClick={() => {
                          setEditingId(entry.id)
                          setEditValue(String(entry.ounces))
                          setEditError(null)
                        }}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive/70 hover:text-destructive"
                        disabled={isPending}
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </li>
                )
              )}
            </ul>
            {editError && <p className="mt-1 text-xs text-destructive">{editError}</p>}
          </div>
        )}
        {!isOptedOut && (
          <div className="border-t border-border pt-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleOptOut}
              className="cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50"
            >
              Sitting out today? Opt out
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
