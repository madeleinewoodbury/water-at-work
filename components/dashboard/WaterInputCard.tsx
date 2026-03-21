'use client'

import { useRef, useState, useTransition } from 'react'
import { logIntake } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const PRESETS = [8, 12, 16, 24]

type Props = { personalTotal: number; dailyGoal: number }

export default function WaterInputCard({ personalTotal, dailyGoal }: Props) {
  const [ounces, setOunces] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Water Intake</CardTitle>
        <CardDescription>
          Your total today:{' '}
          <span className="font-semibold text-foreground">{personalTotal} oz</span>
          <span className="text-muted-foreground"> / {dailyGoal} oz goal</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
