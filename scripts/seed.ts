import { createClient } from '@supabase/supabase-js'

if (process.env.NODE_ENV === 'production') {
  throw new Error('Seed script must not run against production')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment'
  )
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const testUsers = [
  { email: 'alice@example.com', password: 'password123', display_name: 'Alice' },
  { email: 'bob@example.com',   password: 'password123', display_name: 'Bob' },
  { email: 'carol@example.com', password: 'password123', display_name: 'Carol' },
  { email: 'dave@example.com',  password: 'password123', display_name: 'Dave' },
]

const INTAKE_AMOUNTS = [8, 12, 16, 24]
const TODAY_AMOUNTS = [4, 8, 8, 12] // lighter amounts for today (partial day)
const HISTORY_DAYS = 21

/** Delete all existing auth users (cascades to public.users and intake_logs) */
async function reset() {
  console.log('\nResetting database...')
  const { data } = await supabase.auth.admin.listUsers()
  for (const user of data.users) {
    await supabase.auth.admin.deleteUser(user.id)
    console.log(`  deleted  ${user.email}`)
  }
  console.log('  done\n')
}

/** Deterministic-ish random using a simple seed */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/** Generate intake logs for a user over the past HISTORY_DAYS */
function generateIntakeLogs(userId: string, userIndex: number) {
  const logs: { user_id: string; date: string; ounces: number; created_at: string }[] = []
  const today = new Date()

  for (let daysAgo = 0; daysAgo < HISTORY_DAYS; daysAgo++) {
    const date = new Date(today)
    date.setDate(date.getDate() - daysAgo)
    const dateStr = date.toISOString().split('T')[0]

    // Skip some days for realism (roughly 15% skip rate)
    const skipSeed = userIndex * 1000 + daysAgo
    if (seededRandom(skipSeed) < 0.15 && daysAgo > 0) continue

    // Today: 1-2 small entries (partial day); other days: 2-4 entries
    const isToday = daysAgo === 0
    const entryCount = isToday
      ? 1 + Math.floor(seededRandom(skipSeed + 1) * 2)
      : 2 + Math.floor(seededRandom(skipSeed + 1) * 3)

    const amounts = isToday ? TODAY_AMOUNTS : INTAKE_AMOUNTS

    for (let e = 0; e < entryCount; e++) {
      const amountIndex = Math.floor(
        seededRandom(skipSeed + e * 7 + 2) * amounts.length
      )
      const ounces = amounts[amountIndex]

      // Spread entries across the workday (8am - 5pm)
      const maxHour = isToday ? 4 : 9 // today only morning entries
      const hour = 8 + Math.floor(seededRandom(skipSeed + e * 13 + 3) * maxHour)
      const minute = Math.floor(seededRandom(skipSeed + e * 17 + 4) * 60)
      const entryDate = new Date(date)
      entryDate.setHours(hour, minute, 0, 0)

      logs.push({
        user_id: userId,
        date: dateStr,
        ounces,
        created_at: entryDate.toISOString(),
      })
    }
  }

  return logs
}

async function seed() {
  await reset()

  // Create users
  console.log('Creating users...')
  const createdUserIds: { id: string; email: string; index: number }[] = []

  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i]
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { display_name: user.display_name },
    })

    if (error) {
      console.error(`  error  ${user.email}: ${error.message}`)
      continue
    }

    console.log(`  created  ${user.email}`)
    createdUserIds.push({ id: data.user.id, email: user.email, index: i })

    // Update display_name directly in public.users
    await supabase
      .from('users')
      .update({ display_name: user.display_name })
      .eq('id', data.user.id)
  }

  // Generate and insert intake logs
  console.log('\nSeeding intake logs...')
  for (const { id, email, index } of createdUserIds) {
    const logs = generateIntakeLogs(id, index)

    // Insert in batches of 50
    for (let i = 0; i < logs.length; i += 50) {
      const batch = logs.slice(i, i + 50)
      const { error } = await supabase.from('intake_logs').insert(batch)
      if (error) {
        console.error(`  error inserting logs for ${email}: ${error.message}`)
        break
      }
    }

    console.log(`  ${email}: ${logs.length} entries over ${HISTORY_DAYS} days`)
  }

  console.log('\nSeed complete!')
}

seed()
