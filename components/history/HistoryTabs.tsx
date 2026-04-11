'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

type Props = {
  activeTab: 'personal' | 'team'
  hasTeam?: boolean
}

export default function HistoryTabs({ activeTab, hasTeam = true }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function switchTab(tab: 'personal' | 'team') {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'personal') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    params.delete('page')
    router.push(`/history?${params.toString()}`)
  }

  return (
    <div className="flex gap-1 rounded-lg border border-border p-1 w-fit">
      <button
        type="button"
        onClick={() => switchTab('personal')}
        className={cn(
          'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          activeTab === 'personal'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Personal
      </button>
      {hasTeam && (
        <button
          type="button"
          onClick={() => switchTab('team')}
          className={cn(
            'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            activeTab === 'team'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Team
        </button>
      )}
    </div>
  )
}
