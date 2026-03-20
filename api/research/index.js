// api/research/index.js - Claude-powered DSR-style suburb research
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '../_middleware.js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an Australian property investment analyst for PropGear. Research suburbs using web search and return DSR-style scores.

Return ONLY this JSON (no markdown, no explanation):
{"suburbs":[{"suburb":"Name","state":"QLD","postcode":"4350","median_price":620000,"gross_yield":5.8,"vacancy_rate":1.2,"population_growth":2.1,"overall_score":78,"recommendation_tag":"Strong Buy","scores":{"Rental yield":82,"Vacancy rate":90,"Population growth":75,"Infrastructure":68,"Affordability":70,"Airbnb potential":55,"Supply risk":72,"Economic drivers":78},"data_points":[{"label":"Median price","value":"$620k"},{"label":"Price growth","value":"6.2%"},{"label":"Days on market","value":"18"}],"summary":"2-3 sentence analysis.","infrastructure":["Major project 2024"],"risks":["Key risk"]}],"market_overview":"Brief market summary.","search_date":"2026","disclaimer":"AI analysis only. Not financial advice."}

Scoring: yield(100=8%+,80=6-7%,60=5-6%,40=4-5%); vacancy(100=<1%,85=1-2%,70=2-3%,50=3-4%); popgrowth(100=3%+,80=2-3%,65=1-2%,40=0-1%); others 0-100 based on research.`

async function runWithWebSearch(userPrompt) {
  const tools = [{ type: 'web_search_20250305', name: 'web_search' }]
  const messages = [{ role: 'user', content: userPrompt }]

  // Agentic loop — keep going until Claude stops using tools
  for (let i = 0; i < 5; i++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
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
    await supabase.from('research_results').insert({
      user_id: user.userId,
      search_criteria: criteria,
      results
    }).catch(() => {})

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
