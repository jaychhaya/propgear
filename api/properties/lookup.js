// api/properties/lookup.js - AI-powered property lookup
import { verifyToken } from '../_middleware.js'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a property data extraction assistant for Australian real estate.

Given a property address, search realestate.com.au, domain.com.au, and other Australian property sites to find details about that property.

Return ONLY a valid JSON object with this exact structure (use null for any fields you cannot find):
{
  "address": "full street address",
  "suburb": "suburb name",
  "state": "state abbreviation e.g. NSW",
  "postcode": "4 digit postcode",
  "property_type": "residential or unit or townhouse",
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
  "photos": [],
  "description": "brief 1-2 sentence property description",
  "data_sources": ["realestate.com.au", "domain.com.au"]
}

CRITICAL: Return ONLY valid JSON. No markdown, no preamble, no explanation.`

export default async function handler(req, res) {
  let user
  try { user = await verifyToken(req) }
  catch { return res.status(401).json({ error: 'Unauthorized' }) }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { address } = req.body || {}
  if (!address) return res.status(400).json({ error: 'Address required' })

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Look up this Australian property and return its details as JSON: ${address}`
      }]
    })

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock) return res.status(500).json({ error: 'No response from AI' })

    let data
    try {
      const cleaned = textBlock.text.replace(/```json|```/g, '').trim()
      data = JSON.parse(cleaned)
    } catch {
      const match = textBlock.text.match(/\{[\s\S]+\}/)
      if (match) data = JSON.parse(match[0])
      else return res.status(500).json({ error: 'Could not parse property data' })
    }

    return res.status(200).json({ property: data })
  } catch (err) {
    console.error('Lookup error:', err)
    return res.status(500).json({ error: err.message || 'Lookup failed' })
  }
}
