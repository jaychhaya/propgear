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

Your task is to research and score Australian suburbs for investment potential using a DSR-style (Demand-to-Supply Ratio) methodology. Use web search to find current data.

After researching, return a JSON object with this exact structure:
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
        { "label": "Rental demand", "value": "High" }
      ],
      "summary": "2-3 sentence AI analysis of investment potential.",
      "infrastructure": ["$2.1B hospital expansion approved 2023"],
      "risks": ["Single employer town risk"]
    }
  ],
  "market_overview": "Brief 2-3 sentence overview of current Australian property market conditions.",
  "search_date": "March 2026",
  "disclaimer": "AI-generated analysis based on publicly available data. Not financial advice. Always conduct your own due diligence."
}

Scoring:
- Rental yield: 100=8%+, 80=6-7%, 60=5-6%, 40=4-5%, 20=under 4%
- Vacancy rate: 100=under 1%, 85=1-2%, 70=2-3%, 50=3-4%, 30=over 4%
- Population growth: 100=3%+, 80=2-3%, 65=1-2%, 40=0-1%, 20=negative
- Infrastructure: based on approved/under construction government projects
- Affordability: entry point relative to Australian median
- Airbnb potential: tourism, short-stay demand, council regulations
- Supply risk: new supply pipeline vs demand
- Economic drivers: employment diversity, key industries

IMPORTANT: Your final message must contain ONLY the JSON object. No markdown fences, no explanation, just the raw JSON.`

async function runWithWebSearch(userPrompt) {
  const tools = [{ type: 'web_search_20250305', name: 'web_search' }]
  const messages = [{ role: 'user', content: userPrompt }]

  // Agentic loop — keep going until Claude stops using tools
  for (let i = 0; i < 8; i++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      tools,
      system: SYSTEM_PROMPT,
      messages
    })

    // Add assistant response to message history
    messages.push({ role: 'assistant', content: response.content })

    // If Claude is done (no more tool use), extract the text
    if (response.stop_reason === 'end_turn') {
      const textBlocks = response.content.filter(b => b.type === 'text')
      const fullText = textBlocks.map(b => b.text).join('\n')
      return fullText
    }

    // If Claude used tools, collect all tool results and continue
    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use')
      const toolResults = toolUseBlocks.map(block => ({
        type: 'tool_result',
        tool_use_id: block.id,
        content: 'Search completed. Please use the results from the web_search tool to inform your analysis.'
      }))
      messages.push({ role: 'user', content: toolResults })
      continue
    }

    // Unexpected stop reason — try to extract any text
    const textBlocks = response.content.filter(b => b.type === 'text')
    if (textBlocks.length > 0) return textBlocks.map(b => b.text).join('\n')
    break
  }

  throw new Error('Research did not complete after maximum iterations')
}

function extractJSON(text) {
  // Remove markdown fences if present
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()

  // Try direct parse first
  try { return JSON.parse(cleaned) } catch {}

  // Find the outermost { ... } block
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)) } catch {}
  }

  throw new Error('Could not extract valid JSON from AI response')
}

export default async function handler(req, res) {
  let user
  try { user = await verifyToken(req) }
  catch { return res.status(401).json({ error: 'Unauthorized' }) }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const criteria = req.body || {}
  const userPrompt = buildPrompt(criteria)

  try {
    const rawText = await runWithWebSearch(userPrompt)
    const results = extractJSON(rawText)

    // Save to history (non-critical)
    try {
  await supabase.from('research_results').insert({
    user_id: user.userId,
    search_criteria: criteria,
    results
  })
  } catch {}

    return res.status(200).json(results)
  } catch (err) {
    console.error('Research API error:', err)
    return res.status(500).json({ error: err.message || 'Research failed' })
  }
}

function buildPrompt(c) {
  const parts = []

  if (c.suburbs) {
    parts.push(`Research these specific Australian suburbs for investment potential: ${c.suburbs}`)
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

  parts.push(`Search the web for current rental yields, vacancy rates, population growth, median prices, and infrastructure projects for each suburb. Then return your analysis as a JSON object only.`)

  return parts.join('\n')
}
