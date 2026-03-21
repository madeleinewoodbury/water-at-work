import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const isReset = type === 'reset'

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-primary">~</span> WaW
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>
              {isReset
                ? 'Password reset instructions sent'
                : 'Confirm your email address'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isReset
                ? "We've sent a password reset link to your email address. Click the link in the email to set a new password."
                : "We've sent a confirmation link to your email address. Click the link in the email to activate your account."}
            </p>
          </CardContent>

          <CardFooter className="justify-center text-sm text-muted-foreground">
            <Link
              href="/sign-in"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
