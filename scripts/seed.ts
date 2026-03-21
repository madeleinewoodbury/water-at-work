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
  { email: 'alice@example.com', password: 'password123' },
  { email: 'bob@example.com',   password: 'password123' },
  { email: 'carol@example.com', password: 'password123' },
  { email: 'dave@example.com',  password: 'password123' },
]

async function seed() {
  for (const user of testUsers) {
    const { error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    })

    if (error?.message.includes('already been registered')) {
      console.log(`  skip  ${user.email} (already exists)`)
    } else if (error) {
      console.error(`  error  ${user.email}: ${error.message}`)
    } else {
      console.log(`  created  ${user.email}`)
    }
  }
}

seed()
