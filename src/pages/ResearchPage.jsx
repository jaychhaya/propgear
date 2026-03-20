import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import { formatPct } from '../lib/finance.js'

const DEFAULT_CRITERIA = {
  state: '',
  suburbs: '',
  min_yield: '5',
  max_vacancy: '3',
  min_population_growth: '1',
  budget_min: '',
  budget_max: '',
  airbnb_potential: false,
  infrastructure_focus: false,
  property_types: 'residential',
  extra_notes: ''
}

const ScoreBadge = ({ score }) => {
  const color = score >= 75 ? 'var(--green)' : score >= 55 ? 'var(--amber)' : 'var(--red)'
  const bg = score >= 75 ? 'var(--green-dim)' : score >= 55 ? 'var(--amber-dim)' : 'var(--red-dim)'
  return (
    <div style={{
      width: 52, height: 52, borderRadius: '50%',
      background: bg, border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', flexShrink: 0
    }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color, lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: 8, color, opacity: 0.8 }}>/100</div>
    </div>
  )
}

const ScoreBar = ({ label, value, max = 100, color = 'var(--accent)' }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
      <span style={{ color: 'var(--text2)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--mono)', color }}>{value}{max === 100 ? '/100' : ''}</span>
    </div>
    <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2 }}>
      <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: 2, transition: 'width 0.4s' }} />
    </div>
  </div>
)

function SuburbCard({ suburb }) {
  const [expanded, setExpanded] = useState(false)
  const scoreColor = suburb.overall_score >= 75 ? 'var(--green)' : suburb.overall_score >= 55 ? 'var(--amber)' : 'var(--red)'

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}>
        <ScoreBadge score={suburb.overall_score} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{suburb.suburb}</div>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{suburb.state} {suburb.postcode}</span>
            {suburb.recommendation_tag && (
              <span className={`tag tag-${suburb.overall_score >= 70 ? 'green' : suburb.overall_score >= 55 ? 'amber' : 'red'}`}>
                {suburb.recommendation_tag}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text2)' }}>
            {suburb.median_price && <span>Median: <span style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>${(suburb.median_price/1000).toFixed(0)}k</span></span>}
            {suburb.gross_yield != null && <span>Yield: <span style={{ color: 'var(--amber)', fontFamily: 'var(--mono)' }}>{suburb.gross_yield}%</span></span>}
            {suburb.vacancy_rate != null && <span>Vacancy: <span style={{ color: suburb.vacancy_rate > 3 ? 'var(--red)' : 'var(--green)', fontFamily: 'var(--mono)' }}>{suburb.vacancy_rate}%</span></span>}
            {suburb.population_growth != null && <span>Pop. growth: <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{suburb.population_growth}%</span></span>}
          </div>
        </div>
        <div style={{ color: 'var(--text3)', fontSize: 16, transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'none' }}>›</div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
            {/* Score breakdown */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                DSR Score Breakdown
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {suburb.scores && Object.entries(suburb.scores).map(([k, v]) => (
                  <ScoreBar key={k} label={k.replace(/_/g, ' ')} value={v}
                    color={v >= 70 ? 'var(--green)' : v >= 50 ? 'var(--amber)' : 'var(--red)'} />
                ))}
              </div>
            </div>

            {/* Key data */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Market Data
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {suburb.data_points && suburb.data_points.map((point, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text2)' }}>{point.label}</span>
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>{point.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI summary */}
          {suburb.summary && (
            <div style={{ background: 'var(--accent-dim)', border: '1px solid rgba(79,156,249,0.15)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>
              <div style={{ fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontWeight: 600 }}>AI Analysis</div>
              {suburb.summary}
            </div>
          )}

          {/* Infrastructure / govt projects */}
          {suburb.infrastructure && suburb.infrastructure.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontWeight: 600 }}>Infrastructure & Projects</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {suburb.infrastructure.map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--green)', marginTop: 2 }}>✓</span> {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {suburb.risks && suburb.risks.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontWeight: 600 }}>Risks to Consider</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {suburb.risks.map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--amber)', marginTop: 2 }}>⚠</span> {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ResearchPage() {
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])

  useEffect(() => {
    api.research.history().then(d => setHistory(d.results || [])).catch(() => {})
  }, [])

  const set = (k, v) => setCriteria(f => ({ ...f, [k]: v }))

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setResults(null)
    try {
      const data = await api.research.search(criteria)
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 28, maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>AI Research</h1>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>DSR-style suburb scoring powered by Claude + live web search</div>
      </div>

      {/* Search form */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Search Criteria</div>
        <form onSubmit={handleSearch}>
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div>
              <label className="label">State</label>
              <select className="input" value={criteria.state} onChange={e => set('state', e.target.value)} style={{ appearance: 'none' }}>
                <option value="">All states</option>
                {['NSW','VIC','QLD','SA','WA','TAS','ACT','NT'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Property type</label>
              <select className="input" value={criteria.property_types} onChange={e => set('property_types', e.target.value)} style={{ appearance: 'none' }}>
                <option value="residential">Residential house</option>
                <option value="unit">Unit / apartment</option>
                <option value="any">Any type</option>
              </select>
            </div>
            <div className="span-2">
              <label className="label">Specific suburbs to research (optional, comma-separated)</label>
              <input className="input" placeholder="e.g. Toowoomba, Ballarat, Launceston" value={criteria.suburbs} onChange={e => set('suburbs', e.target.value)} />
            </div>
            <div>
              <label className="label">Min gross yield (%)</label>
              <input className="input" type="number" step="0.1" value={criteria.min_yield} onChange={e => set('min_yield', e.target.value)} placeholder="5" />
            </div>
            <div>
              <label className="label">Max vacancy rate (%)</label>
              <input className="input" type="number" step="0.1" value={criteria.max_vacancy} onChange={e => set('max_vacancy', e.target.value)} placeholder="3" />
            </div>
            <div>
              <label className="label">Min population growth (%)</label>
              <input className="input" type="number" step="0.1" value={criteria.min_population_growth} onChange={e => set('min_population_growth', e.target.value)} placeholder="1" />
            </div>
            <div>
              <label className="label">Budget min ($)</label>
              <input className="input" type="number" value={criteria.budget_min} onChange={e => set('budget_min', e.target.value)} placeholder="300000" />
            </div>
            <div>
              <label className="label">Budget max ($)</label>
              <input className="input" type="number" value={criteria.budget_max} onChange={e => set('budget_max', e.target.value)} placeholder="800000" />
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={criteria.airbnb_potential} onChange={e => set('airbnb_potential', e.target.checked)} />
              <span style={{ color: 'var(--text2)' }}>Prioritise Airbnb potential</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={criteria.infrastructure_focus} onChange={e => set('infrastructure_focus', e.target.checked)} />
              <span style={{ color: 'var(--text2)' }}>Focus on infrastructure / govt projects</span>
            </label>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label">Additional notes / requirements</label>
            <textarea className="input" rows={2} placeholder="e.g. Near university, coastal, mining town, regional city growth corridor…"
              value={criteria.extra_notes} onChange={e => set('extra_notes', e.target.value)} style={{ resize: 'vertical' }} />
          </div>

          {error && (
            <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '10px 24px' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Researching with AI…
              </span>
            ) : '◎ Run AI Research'}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text2)' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>◎</div>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>Claude is researching…</div>
          <div style={{ fontSize: 13 }}>Searching for market data, yield statistics, infrastructure projects, and generating DSR-style scores. This may take 20–40 seconds.</div>
        </div>
      )}

      {/* Results */}
      {results && results.suburbs && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {results.suburbs.length} suburbs analysed
              {results.search_date && <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400, marginLeft: 10 }}>as of {results.search_date}</span>}
            </div>
            {results.disclaimer && (
              <div style={{ fontSize: 11, color: 'var(--text3)', maxWidth: 400, textAlign: 'right' }}>{results.disclaimer}</div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.suburbs
              .sort((a, b) => b.overall_score - a.overall_score)
              .map((suburb, i) => <SuburbCard key={i} suburb={suburb} />)}
          </div>

          {results.market_overview && (
            <div className="card" style={{ marginTop: 16, background: 'var(--bg2)' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontWeight: 600 }}>Market Overview</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{results.market_overview}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
