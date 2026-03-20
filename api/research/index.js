// api/research/index.js - Claude-powered DSR-style suburb research
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '../_middleware.js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are PropGear's AI research engine — an expert Australian property investment analyst.

Your task is to research and score Australian suburbs for investment potential using a DSR-style (Demand-to-Supply Ratio) methodology.

For each suburb researched, you must return a JSON object with this exact structure:
{
  "suburbs": [
    {
      "suburb": "Suburb Name",
      "state": "QLD",
      "postcode": "4350",
      "median_price": 620000,
      "gross_yield": 5.8,
      "vacancy_rate": 1.2,
      "population_growth": 2.1,
      "overall_score": 78,
      "recommendation_tag": "Strong Buy",
      "scores": {
        "Rental yield": 82,
        "Vacancy rate": 90,
        "Population growth": 75,
        "Infrastructure": 68,
        "Affordability": 70,
        "Airbnb potential": 55,
        "Supply risk": 72,
        "Economic drivers": 78
      },
      "data_points": [
        { "label": "Median house price", "value": "$620,000" },
        { "label": "Annual price growth", "value": "6.2%" },
        { "label": "Days on market", "value": "18 days" },
        { "label": "Auction clearance", "value": "72%" },
        { "label": "Distance to CBD", "value": "85km" },
        { "label": "Rental demand", "value": "High" }
      ],
      "summary": "A detailed 2-3 sentence AI analysis of why this suburb is or isn't a good investment.",
      "infrastructure": [
        "$2.1B hospital expansion approved 2023",
        "New university campus opening 2025",
        "Highway duplication project underway"
      ],
      "risks": [
        "Single employer town risk (mining sector)",
        "Limited population diversity"
      ]
    }
  ],
  "market_overview": "A brief 2-3 sentence overview of current Australian property market conditions relevant to the search.",
  "search_date": "March 2026",
  "disclaimer": "AI-generated analysis based on publicly available data. Not financial advice. Always conduct your own due diligence."
}

Scoring methodology:
- Rental yield score: 100 = 8%+ yield, 80 = 6-7%, 60 = 5-6%, 40 = 4-5%, 20 = under 4%
- Vacancy rate score: 100 = under 1%, 85 = 1-2%, 70 = 2-3%, 50 = 3-4%, 30 = over 4%
- Population growth: 100 = 3%+, 80 = 2-3%, 65 = 1-2%, 40 = 0-1%, 20 = negative
- Infrastructure: based on approved/under construction government projects nearby
- Affordability: relative to Australian median, entry point, yield compression risk
- Airbnb potential: tourism rating, short-stay demand, council regulations
- Supply risk: new apartment/housing supply pipeline vs demand
- Economic drivers: employment diversity, GDP contribution, key industries

CRITICAL: Return ONLY valid JSON. No markdown, no preamble, no explanation outside the JSON structure.`

export default async function handler(req, res) {
  let user
  try { user = await verifyToken(req) }
  catch { return res.status(401).json({ error: 'Unauthorized' }) }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const criteria = req.body || {}

  const userPrompt = buildPrompt(criteria)

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }]
    })

    // Extract text from response (may be after tool use)
    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock) return res.status(500).json({ error: 'No response from AI' })

    // Parse JSON from response
    let results
    try {
      const cleaned = textBlock.text.replace(/```json|```/g, '').trim()
      results = JSON.parse(cleaned)
    } catch {
      // Try to extract JSON from response
      const match = textBlock.text.match(/\{[\s\S]+\}/)
      if (match) {
        results = JSON.parse(match[0])
      } else {
        return res.status(500).json({ error: 'Could not parse AI response as JSON' })
      }
    }

    // Save to history
    await supabase.from('research_results').insert({
      user_id: user.userId,
      search_criteria: criteria,
      results
    }).catch(() => {}) // non-critical

    return res.status(200).json(results)
  } catch (err) {
    console.error('Research API error:', err)
    return res.status(500).json({ error: err.message || 'Research failed' })
  }
}

function buildPrompt(c) {
  const parts = []

  if (c.suburbs) {
    parts.push(`Research these specific suburbs: ${c.suburbs}`)
  } else {
    parts.push(`Find the top 5 investment suburbs in ${c.state ? c.state : 'Australia'}`)
  }

  if (c.budget_min || c.budget_max) {
    parts.push(`Budget range: ${c.budget_min ? '$' + Number(c.budget_min).toLocaleString() : 'no minimum'} to ${c.budget_max ? '$' + Number(c.budget_max).toLocaleString() : 'no maximum'}`)
  }

  if (c.min_yield) parts.push(`Minimum gross yield required: ${c.min_yield}%`)
  if (c.max_vacancy) parts.push(`Maximum acceptable vacancy rate: ${c.max_vacancy}%`)
  if (c.min_population_growth) parts.push(`Minimum population growth: ${c.min_population_growth}% per year`)
  if (c.property_types) parts.push(`Property type focus: ${c.property_types}`)
  if (c.airbnb_potential) parts.push(`Prioritise suburbs with strong Airbnb / short-stay rental potential`)
  if (c.infrastructure_focus) parts.push(`Prioritise suburbs with major approved or under-construction government infrastructure projects`)
  if (c.extra_notes) parts.push(`Additional requirements: ${c.extra_notes}`)

  parts.push(`Use web search to find current data on rental yields, vacancy rates, population growth, median prices, and any major infrastructure projects. Score each suburb using the DSR methodology. Return as JSON only.`)

  return parts.join('\n')
}
