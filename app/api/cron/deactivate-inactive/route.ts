import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin.rpc('deactivate_inactive_users')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const deactivatedIds = (data as string[]) ?? []

  return NextResponse.json({
    deactivated: deactivatedIds.length,
    ids: deactivatedIds,
  })
}
