// api/auth/login.js - Vercel serverless function
import { createClient } from '@supabase/supabase-js'
import { SignJWT } from 'jose'
import { scryptSync, timingSafeEqual } from 'node:crypto'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // use service key server-side
)

function verifyPassword(password, hash) {
  try {
    // hash format: salt:hash (both hex)
    const [saltHex, storedHash] = hash.split(':')
    const salt = Buffer.from(saltHex, 'hex')
    const derived = scryptSync(password, salt, 64)
    const stored = Buffer.from(storedHash, 'hex')
    return timingSafeEqual(derived, stored)
  } catch { return false }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })

  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, password_hash')
    .eq('username', username.toLowerCase().trim())
    .single()

  if (error || !user) return res.status(401).json({ error: 'Invalid username or password' })

  if (!verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const token = await new SignJWT({ userId: user.id, username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret)

  return res.status(200).json({
    token,
    user: { id: user.id, username: user.username }
  })
}
