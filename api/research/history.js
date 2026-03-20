// api/research/history.js
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

  const { data, error } = await supabase
    .from('research_results')
    .select('id, search_criteria, created_at')
    .eq('user_id', user.userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ results: data })
}
