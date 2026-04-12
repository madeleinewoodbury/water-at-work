'use client'

import { useState, useTransition } from 'react'
import { useActionState } from 'react'
import { Users, Pencil, X } from 'lucide-react'
import { updateTeam } from '@/app/teams/actions'
import { Input } from '@/components/ui/input'

type Props = {
  team: {
    id: string
    name: string
    slug: string
    created_at: string
  }
  isAdmin: boolean
  memberCount: number
}

export default function TeamHeader({ team, isAdmin, memberCount }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [state, formAction, isPending] = useActionState(updateTeam, null)
  const [, startTransition] = useTransition()

  const createdDate = new Date(team.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  if (isEditing) {
    return (
      <div className="space-y-3">
        <form
          action={(formData) => {
            startTransition(() => {
              formAction(formData)
            })
            setIsEditing(false)
          }}
          className="flex gap-2"
        >
          <input type="hidden" name="team_id" value={team.id} />
          <Input
            name="name"
            defaultValue={team.name}
            maxLength={50}
            required
            autoFocus
            className="text-lg font-bold"
          />
          <button
            type="submit"
            disabled={isPending}
            className="shrink-0 cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="shrink-0 cursor-pointer rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </form>
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </span>
        <span>Created {createdDate}</span>
      </div>
    </div>
  )
}
