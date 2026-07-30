// Applies a SQL migration to the Supabase Postgres database.
//
// Usage:
//   DATABASE_URL="postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres" \
//     node scripts/apply-migration.mjs supabase/migrations/001_initial_schema.sql
//
// DATABASE_URL is read from .env.local when present. Never hardcode credentials here.

import fs from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key]) continue
    process.env[key] = rawValue.replace(/^["']|["']$/g, '')
  }
}

loadEnvLocal()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set. Add it to .env.local or pass it inline.')
  process.exit(1)
}

const file = process.argv[2] ?? 'supabase/migrations/001_initial_schema.sql'
if (!fs.existsSync(file)) {
  console.error(`Migration file not found: ${file}`)
  process.exit(1)
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  await client.query(fs.readFileSync(file, 'utf8'))
  console.log(`Migration applied: ${file}`)
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  await client.end()
}
