'use client'

import { useState, useTransition } from 'react'
import { updateDisplayName } from '@/app/profile/actions'
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

type Props = { currentName: string | null; email: string }

export default function DisplayNameForm({ currentName, email }: Props) {
  const [name, setName] = useState(currentName ?? '')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateDisplayName(null, formData)
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
        <CardTitle>Display Name</CardTitle>
        <CardDescription>
          This is how your name appears to the team. Defaults to{' '}
          <span className="font-medium">{email.split('@')[0]}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="display_name">Name</Label>
            <Input
              id="display_name"
              name="display_name"
              placeholder={email.split('@')[0]}
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
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
