import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DangerZoneCard() {
  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>Irreversible account actions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Delete Account</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data.
            </p>
          </div>
          <button
            disabled
            className="shrink-0 rounded-md border border-destructive/50 px-3 py-1.5 text-sm font-medium text-destructive opacity-40 cursor-not-allowed"
          >
            Delete Account
          </button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Account deletion is not yet available.</p>
      </CardContent>
    </Card>
  )
}
