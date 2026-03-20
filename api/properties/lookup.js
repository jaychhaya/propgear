// api/properties/lookup.js - AI-powered property lookup
import { verifyToken } from '../_middleware.js'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a property data extraction assistant for Australian real estate.

Search realestate.com.au, domain.com.au, and other Australian property sites to find details about the given address.

Your final message must contain ONLY this JSON object (use null for missing fields):
{
  "address": "full street address",
  "suburb": "suburb name",
  "state": "NSW",
  "postcode": "2026",
  "property_type": "residential",
  "bedrooms": 3,
  "bathrooms": 2,
  "garage": 1,
  "land_area_sqm": 650,
  "floor_area_sqm": 180,
  "last_sold_price": 850000,
  "last_sold_date": "2021-06",
  "current_valuation_estimate": 920000,
  "valuation_range_low": 880000,
  "valuation_range_high": 960000,
  "weekly_rent_estimate": 650,
  "description": "brief 1-2 sentence property description",
  "data_sources": ["realestate.com.au"]
}

No markdown, no explanation — just the raw JSON object.`

async function runWithWebSearch(address) {
  const tools = [{ type: 'web_search_20250305', name: 'web_search' }]
  const messages = [{ role: 'user', content: `Look up this Australian property and return its details as JSON: ${address}` }]

  for (let i = 0; i < 6; i++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      tools,
      system: SYSTEM_PROMPT,
      messages
    })

    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      const textBlocks = response.content.filter(b => b.type === 'text')
      return textBlocks.map(b => b.text).join('\n')
    }

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use')
      const toolResults = toolUseBlocks.map(block => ({
        type: 'tool_result',
        tool_use_id: block.id,
        content: 'Search completed.'
      }))
      messages.push({ role: 'user', content: toolResults })
      continue
    }

    const textBlocks = response.content.filter(b => b.type === 'text')
    if (textBlocks.length > 0) return textBlocks.map(b => b.text).join('\n')
    break
  }

  throw new Error('Lookup did not complete')
}

function extractJSON(text) {
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  try { return JSON.parse(cleaned) } catch {}
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(cleaned.slice(start, end + 1)) } catch {}
  }
  throw new Error('Could not parse property data')
}

export default async function handler(req, res) {
  let user
  try { user = await verifyToken(req) }
  catch { return res.status(401).json({ error: 'Unauthorized' }) }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { address } = req.body || {}
  if (!address) return res.status(400).json({ error: 'Address required' })

  try {
    const rawText = await runWithWebSearch(address)
    const data = extractJSON(rawText)
    return res.status(200).json({ property: data })
  } catch (err) {
    console.error('Lookup error:', err)
    return res.status(500).json({ error: err.message || 'Lookup failed' })
  }
}
