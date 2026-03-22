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
    <main className="flex flex-1 flex-col items-center justify-center px-6 pb-14">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>
              {isReset
                ? 'Password reset instructions sent'
                : 'Confirm your email address'}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {isReset
                ? "We've sent a password reset link to your email address. Click the link in the email to set a new password."
                : "We've sent a confirmation link to your email address. Click the link in the email to activate your account."}
            </p>
            <p className="text-sm text-muted-foreground">
              Don&apos;t see it? Check your spam or junk folder.
            </p>
          </CardContent>

          <CardFooter className="justify-center text-sm text-muted-foreground">
            <Link
              href="/sign-in"
              className="cursor-pointer font-medium text-primary underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
