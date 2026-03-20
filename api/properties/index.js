// api/properties/index.js
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '../_middleware.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  let user
  try { user = await verifyToken(req) }
  catch { return res.status(401).json({ error: 'Unauthorized' }) }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ properties: data })
  }

  if (req.method === 'POST') {
    const body = { ...req.body, user_id: user.userId }
    delete body.id // never trust client-sent id

    const { data, error } = await supabase
      .from('properties')
      .insert(body)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ property: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
