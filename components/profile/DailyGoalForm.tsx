'use client'

import { useState, useTransition } from 'react'
import { updateDailyGoal } from '@/app/profile/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type Props = { currentGoal: number }

export default function DailyGoalForm({ currentGoal }: Props) {
  const [goal, setGoal] = useState(String(currentGoal))
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateDailyGoal(null, formData)
      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else if (result?.success) {
        setMessage({ type: 'success', text: result.success })
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Goal</CardTitle>
        <CardDescription>Set your daily water intake target in ounces.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="daily_goal">Goal (oz)</Label>
            <Input
              id="daily_goal"
              name="daily_goal"
              type="number"
              min={1}
              step="0.1"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={isPending || !goal}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
            {message && (
              <p
                className={`text-sm ${message.type === 'error' ? 'text-destructive' : 'text-success'}`}
              >
                {message.text}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
