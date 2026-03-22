'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

function getSiteOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000'
  throw new Error(
    'NEXT_PUBLIC_SITE_URL environment variable is required in production'
  )
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const origin = getSiteOrigin()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string
  if (password !== confirmPassword) {
    redirect('/sign-up?error=Passwords+do+not+match')
  }

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/sign-up?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/check-email')
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()
  const origin = getSiteOrigin()

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get('email') as string,
    { redirectTo: `${origin}/auth/callback?next=/auth/update-password` }
  )

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/check-email?type=reset')
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: formData.get('password') as string,
  })

  if (error) {
    redirect(`/auth/update-password?error=${encodeURIComponent(error.message)}`)
  }

  const cookieStore = await cookies()
  cookieStore.delete('pw_recovery')
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
