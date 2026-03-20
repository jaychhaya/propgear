// api/properties/[id].js
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

  const { id } = req.query

  // Verify ownership
  const { data: existing } = await supabase
    .from('properties')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (!existing) return res.status(404).json({ error: 'Property not found' })
  if (existing.user_id !== user.userId) return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ property: data })
  }

  if (req.method === 'PUT') {
    const body = { ...req.body, updated_at: new Date().toISOString() }
    delete body.id
    delete body.user_id

    const { data, error } = await supabase
      .from('properties')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ property: data })
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('properties').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
