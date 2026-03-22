import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_NEXT_PATHS = ['/onboarding', '/auth/update-password']

const PW_RECOVERY_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  maxAge: 600,
  path: '/',
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')

  const supabase = await createClient()

  // PKCE flow (OAuth, some magic link setups)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(
        new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, origin)
      )
    }
    const nextParam = searchParams.get('next')
    const next = ALLOWED_NEXT_PATHS.includes(nextParam ?? '') ? nextParam! : '/onboarding'
    const response = NextResponse.redirect(new URL(next, origin))
    if (next === '/auth/update-password') {
      response.cookies.set('pw_recovery', '1', PW_RECOVERY_COOKIE_OPTIONS)
    }
    return response
  }

  // OTP flow (email confirmation, password reset)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (error) {
      return NextResponse.redirect(
        new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, origin)
      )
    }
    if (type === 'recovery') {
      const response = NextResponse.redirect(new URL('/auth/update-password', origin))
      response.cookies.set('pw_recovery', '1', PW_RECOVERY_COOKIE_OPTIONS)
      return response
    }
    return NextResponse.redirect(new URL('/onboarding', origin))
  }

  return NextResponse.redirect(
    new URL('/sign-in?error=Invalid+confirmation+link', origin)
  )
}
