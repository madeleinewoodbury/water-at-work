'use client'

import { useState } from 'react'
import { Github } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function GitHubAuthButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGitHubLogin() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGitHubLogin}
        disabled={loading}
      >
        <Github />
        {loading ? 'Redirecting...' : 'Continue with GitHub'}
      </Button>
    </div>
  )
}
