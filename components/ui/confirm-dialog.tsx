'use client'

import * as React from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { cn } from '@/lib/utils'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  body?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  isPending?: boolean
  pendingLabel?: string
  confirmDisabled?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  isPending = false,
  pendingLabel,
  confirmDisabled = false,
  onConfirm,
}: ConfirmDialogProps) {
  async function handleConfirm() {
    await onConfirm()
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity duration-150" />
        <Dialog.Popup
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
            'rounded-lg border border-border bg-card p-6 shadow-lg outline-none',
            'data-[ending-style]:opacity-0 data-[starting-style]:opacity-0',
            'data-[ending-style]:scale-95 data-[starting-style]:scale-95',
            'transition-all duration-150'
          )}
        >
          <Dialog.Title className="text-lg font-semibold text-foreground">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {description}
            </Dialog.Description>
          )}
          {body && <div className="mt-4">{body}</div>}
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close
              disabled={isPending}
              className="cursor-pointer rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelLabel}
            </Dialog.Close>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending || confirmDisabled}
              className={cn(
                'cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                destructive
                  ? 'border border-destructive text-destructive hover:bg-destructive hover:text-white'
                  : 'bg-primary text-primary-foreground hover:bg-primary/85'
              )}
            >
              {isPending ? (pendingLabel ?? `${confirmLabel}...`) : confirmLabel}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
