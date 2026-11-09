import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { RETIRED_HEADER, RETIRED_PATH, isRetired } from '@/lib/retirement'

function serveRetiredSplash(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Cron jobs and other API calls become no-ops.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ retired: true }, { status: 200 })
  }

  // Form posts and server actions from tabs opened before the switch.
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new NextResponse('Water at Work has been retired.', { status: 410 })
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(RETIRED_HEADER, '1')
  return NextResponse.rewrite(new URL(RETIRED_PATH, request.url), {
    request: { headers: requestHeaders },
  })
}

export async function proxy(request: NextRequest) {
  // Once retired (or when previewing /retired), serve the splash page before
  // any Supabase client is created.
  if (isRetired() || request.nextUrl.pathname === RETIRED_PATH) {
    return serveRetiredSplash(request)
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Use getUser() — makes a server-side call to verify the session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const protectedPaths = ['/dashboard', '/profile', '/history', '/onboarding', '/teams']
  if (!user && protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  const authOnlyPaths = ['/sign-in', '/sign-up', '/forgot-password', '/check-email']
  if (user && authOnlyPaths.some((p) => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (request.nextUrl.pathname.startsWith('/auth/update-password')) {
    if (!user) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
    if (!request.cookies.get('pw_recovery')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
