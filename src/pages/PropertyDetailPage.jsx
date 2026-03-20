import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'
import { api } from '../lib/api.js'
import { formatCurrency, formatPct, grossYield, netYield, equity, lvr, capitalGrowth, monthlyRepayment, projectValues } from '../lib/finance.js'
import PropertyForm from '../components/dashboard/PropertyForm.jsx'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, display: 'flex', gap: 8 }}>
          <span>{p.name}:</span><span style={{ fontFamily: 'var(--mono)' }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function Metric({ label, value, color, sub }) {
  return (
    <div style={{ padding: '14px 16px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--mono)', color: color || 'var(--text)', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [growthRate, setGrowthRate] = useState(7)

  const load = () => {
    api.properties.get(id)
      .then(d => setProperty(d.property))
      .catch(() => navigate('/properties'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleSave = async (data) => {
    await api.properties.update(id, data)
    setEditing(false)
    load()
  }

  if (loading) return <div style={{ padding: 32, color: 'var(--text2)' }}>Loading…</div>
  if (!property) return null

  const p = property
  const currentVal = p.current_valuation || p.purchase_price || 0
  const gYield = grossYield(p.weekly_rent, currentVal)
  const nYield = netYield(p.weekly_rent, p.annual_expenses, currentVal)
  const eq = equity(currentVal, p.loan_amount)
  const lvrPct = lvr(p.loan_amount, currentVal)
  const capGrowth = capitalGrowth(p.purchase_price, currentVal)
  const monthlyRep = monthlyRepayment(p.loan_amount, p.interest_rate, p.loan_term_years)

  // YoY projection
  const projection = projectValues(currentVal, p.loan_amount, 10, growthRate / 100)

  // Breakdown bar data
  const breakdown = [
    { name: 'Purchase', value: p.purchase_price || 0 },
    { name: 'Valuation', value: currentVal },
    { name: 'Loan', value: p.loan_amount || 0 },
    { name: 'Equity', value: eq }
  ]
  const barColors = ['#4f9cf9', '#34d399', '#f87171', '#a78bfa']

  // Airbnb annual income estimate
  const airbnbAnnual = p.airbnb_enabled && p.airbnb_nightly_rate && p.airbnb_occupancy_rate
    ? p.airbnb_nightly_rate * 365 * (p.airbnb_occupancy_rate / 100)
    : null

  if (editing) return (
    <div style={{ padding: 28, maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-ghost" onClick={() => setEditing(false)}>← Back</button>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Edit {p.nickname || p.address}</h1>
      </div>
      <div className="card">
        <PropertyForm initial={p} onSave={handleSave} onCancel={() => setEditing(false)} />
      </div>
    </div>
  )

  return (
    <div style={{ padding: 28, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <button className="btn btn-ghost" style={{ marginBottom: 10, padding: '4px 10px', fontSize: 12 }} onClick={() => navigate('/properties')}>
            ← Properties
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{p.nickname || p.address}</h1>
            <span className={`tag tag-${p.interest_type === 'fixed' ? 'blue' : p.interest_type === 'split' ? 'amber' : 'green'}`}>
              {p.interest_type || 'variable'}
            </span>
            {p.is_vacant && <span className="tag tag-red">vacant</span>}
            {p.airbnb_enabled && <span className="tag tag-purple">airbnb</span>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
            {p.address}{p.suburb ? `, ${p.suburb}` : ''}{p.state ? ` ${p.state}` : ''}{p.postcode ? ` ${p.postcode}` : ''}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit property</button>
      </div>

      {/* Key metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
        <Metric label="Current Valuation" value={formatCurrency(currentVal)} color="var(--accent)" />
        <Metric label="Purchase Price" value={formatCurrency(p.purchase_price)} />
        <Metric label="Capital Growth" value={formatPct(capGrowth)} color={capGrowth >= 0 ? 'var(--green)' : 'var(--red)'} />
        <Metric label="Equity" value={formatCurrency(eq)} color="var(--green)" />
        <Metric label="Loan Amount" value={formatCurrency(p.loan_amount)} />
        <Metric label="LVR" value={formatPct(lvrPct)} color={lvrPct > 80 ? 'var(--red)' : lvrPct > 70 ? 'var(--amber)' : 'var(--text)'} />
        <Metric label="Interest Rate" value={p.interest_rate ? `${p.interest_rate}%` : '—'} color="var(--accent)" sub={p.interest_type} />
        <Metric label="Monthly Repayment" value={formatCurrency(monthlyRep)} sub="P&I estimate" />
        <Metric label="Gross Yield" value={formatPct(gYield)} color="var(--amber)" />
        <Metric label="Net Yield" value={formatPct(nYield)} color="var(--amber)" />
        <Metric label="Weekly Rent" value={formatCurrency(p.weekly_rent)} />
        <Metric label="Annual Expenses" value={formatCurrency(p.annual_expenses)} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Breakdown bar */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Financial Breakdown</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={breakdown} layout="vertical" barCategoryGap="20%">
              <XAxis type="number" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--text2)' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {breakdown.map((_, i) => <Cell key={i} fill={barColors[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Airbnb vs long-term rental */}
        {airbnbAnnual && (
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Airbnb vs Long-Term Rental</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Long-term rental (annual)</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 20, color: 'var(--text)' }}>{formatCurrency((p.weekly_rent || 0) * 52)}</div>
              </div>
              <div style={{ background: 'var(--purple-dim)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Airbnb estimate (annual)</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 20, color: 'var(--purple)' }}>{formatCurrency(airbnbAnnual)}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                  ${p.airbnb_nightly_rate}/night · {p.airbnb_occupancy_rate}% occupancy
                </div>
              </div>
              <div style={{
                background: airbnbAnnual > (p.weekly_rent || 0) * 52 ? 'var(--green-dim)' : 'var(--amber-dim)',
                border: `1px solid ${airbnbAnnual > (p.weekly_rent || 0) * 52 ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
                borderRadius: 8, padding: '10px 14px', fontSize: 12,
                color: airbnbAnnual > (p.weekly_rent || 0) * 52 ? 'var(--green)' : 'var(--amber)'
              }}>
                {airbnbAnnual > (p.weekly_rent || 0) * 52
                  ? `Airbnb earns ${formatCurrency(airbnbAnnual - (p.weekly_rent || 0) * 52)} more per year`
                  : `Long-term earns ${formatCurrency((p.weekly_rent || 0) * 52 - airbnbAnnual)} more per year`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* YoY Projection */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>10-Year Projection</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>Growth rate</span>
            <input type="range" min="2" max="15" value={growthRate} onChange={e => setGrowthRate(+e.target.value)} style={{ width: 90 }} />
            <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--accent)', minWidth: 30 }}>{growthRate}%</span>
          </div>
        </div>

        {/* Summary in 10 years */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Value in 10yr', value: formatCurrency(projection[10]?.value), color: 'var(--accent)' },
            { label: 'Equity in 10yr', value: formatCurrency(projection[10]?.equity), color: 'var(--green)' },
            { label: 'Loan in 10yr', value: formatCurrency(projection[10]?.loan), color: 'var(--text)' }
          ].map(m => (
            <div key={m.label} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 600, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={projection}>
            <defs>
              <linearGradient id="gv2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f9cf9" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4f9cf9" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="ge2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="value" name="Property Value" stroke="#4f9cf9" fill="url(#gv2)" strokeWidth={2} />
            <Area type="monotone" dataKey="equity" name="Equity" stroke="#34d399" fill="url(#ge2)" strokeWidth={2} />
            <Area type="monotone" dataKey="loan" name="Loan Balance" stroke="#f87171" fill="none" strokeWidth={1.5} strokeDasharray="4 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Notes */}
      {p.notes && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Notes</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{p.notes}</div>
        </div>
      )}
    </div>
  )
}
