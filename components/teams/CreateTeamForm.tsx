'use client'

import { useActionState } from 'react'
import { createTeam } from '@/app/teams/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function CreateTeamForm() {
  const [state, formAction, isPending] = useActionState(createTeam, null)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Team Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="e.g. The Hydration Station"
          maxLength={50}
          required
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Team'}
      </Button>
    </form>
  )
}
