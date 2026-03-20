// api/auth/register.js - Vercel serverless function
import { createClient } from '@supabase/supabase-js'
import { SignJWT } from 'jose'
import { scryptSync, randomBytes } from 'crypto'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })

  const clean = username.toLowerCase().trim()
  if (!/^[a-z0-9_]{3,30}$/.test(clean)) {
    return res.status(400).json({ error: 'Username must be 3-30 chars, letters/numbers/underscore only' })
  }

  const passwordHash = hashPassword(password)

  const { data: user, error } = await supabase
    .from('users')
    .insert({ username: clean, password_hash: passwordHash })
    .select('id, username')
    .single()

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Username already taken' })
    return res.status(500).json({ error: 'Registration failed' })
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const token = await new SignJWT({ userId: user.id, username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret)

  return res.status(201).json({
    token,
    user: { id: user.id, username: user.username }
  })
}
