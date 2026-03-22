import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const next = searchParams.get('next') ?? '/dashboard'
    const response = NextResponse.redirect(new URL(next, origin))
    if (next === '/auth/update-password') {
      response.cookies.set('pw_recovery', '1', { httpOnly: true, maxAge: 600, path: '/' })
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
      response.cookies.set('pw_recovery', '1', { httpOnly: true, maxAge: 600, path: '/' })
      return response
    }
    return NextResponse.redirect(new URL('/dashboard', origin))
  }

  return NextResponse.redirect(
    new URL('/sign-in?error=Invalid+confirmation+link', origin)
  )
}
