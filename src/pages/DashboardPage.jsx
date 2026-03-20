import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts'
import { api } from '../lib/api.js'
import { portfolioTotals, grossYield, equity, capitalGrowth, formatCurrency, formatPct, projectValues } from '../lib/finance.js'

const COLORS = ['#4f9cf9', '#34d399', '#fbbf24', '#a78bfa', '#f87171', '#fb923c']

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card-sm" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--mono)', color: color || 'var(--text)', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text2)' }}>{sub}</div>}
    </div>
  )
}

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

export default function DashboardPage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [growthRate, setGrowthRate] = useState(7)
  const navigate = useNavigate()

  useEffect(() => {
    api.properties.list()
      .then(d => setProperties(d.properties || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ padding: 32, color: 'var(--text2)' }}>Loading portfolio…</div>
  )

  if (properties.length === 0) return (
    <div style={{ padding: 32 }}>
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Welcome to PropGear</div>
      <div style={{ color: 'var(--text2)', marginBottom: 20 }}>Add your first property to get started.</div>
      <button className="btn btn-primary" onClick={() => navigate('/properties')}>Add property →</button>
    </div>
  )

  const totals = portfolioTotals(properties)
  const totalEquity = totals.totalValue - totals.totalLoan
  const totalGrowth = capitalGrowth(totals.totalPurchase, totals.totalValue)
  const portfolioYield = grossYield(totals.totalWeeklyRent, totals.totalValue)

  // Breakdown pie data
  const pieData = properties.map((p, i) => ({
    name: p.nickname || p.address,
    value: p.current_valuation || p.purchase_price || 0,
    color: COLORS[i % COLORS.length]
  }))

  // Bar chart: purchase vs value vs loan per property
  const barData = properties.map(p => ({
    name: p.nickname || p.suburb || 'Property',
    'Purchase': p.purchase_price || 0,
    'Valuation': p.current_valuation || p.purchase_price || 0,
    'Loan': p.loan_amount || 0
  }))

  // YoY projection using combined portfolio
  const projectionData = projectValues(totals.totalValue, totals.totalLoan, 10, growthRate / 100)

  // Interest type breakdown
  const interestTypes = properties.reduce((acc, p) => {
    const t = p.interest_type || 'variable'
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})

  return (
    <div style={{ padding: 28, maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>Portfolio Overview</h1>
          <div style={{ color: 'var(--text2)', fontSize: 13 }}>{properties.length} properties tracked</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/properties')}>Manage →</button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Portfolio Value" value={formatCurrency(totals.totalValue)} sub={`${properties.length} properties`} color="var(--accent)" />
        <StatCard label="Total Equity" value={formatCurrency(totalEquity)} sub="value minus loans" color="var(--green)" />
        <StatCard label="Total Loans" value={formatCurrency(totals.totalLoan)} />
        <StatCard label="Capital Growth" value={formatPct(totalGrowth)} sub="vs purchase price" color={totalGrowth >= 0 ? 'var(--green)' : 'var(--red)'} />
        <StatCard label="Gross Yield" value={formatPct(portfolioYield)} sub="annual rental / value" color="var(--amber)" />
        <StatCard label="Weekly Rent" value={formatCurrency(totals.totalWeeklyRent)} sub="all properties" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 16 }}>
        {/* Bar chart */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Purchase · Valuation · Loan by Property</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barCategoryGap="25%">
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Purchase" fill="#4f9cf9" radius={[4,4,0,0]} />
              <Bar dataKey="Valuation" fill="#34d399" radius={[4,4,0,0]} />
              <Bar dataKey="Loan" fill="#f87171" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Portfolio breakdown pie */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Portfolio Breakdown</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                <span style={{ color: 'var(--text2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>{formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* YoY Projection */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Portfolio Projection (10 Years)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>Growth rate</span>
            <input
              type="range" min="3" max="15" value={growthRate}
              onChange={e => setGrowthRate(+e.target.value)}
              style={{ width: 100 }}
            />
            <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--accent)', minWidth: 30 }}>{growthRate}%</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={projectionData}>
            <defs>
              <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f9cf9" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4f9cf9" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="value" name="Portfolio Value" stroke="#4f9cf9" fill="url(#gv)" strokeWidth={2} />
            <Area type="monotone" dataKey="equity" name="Total Equity" stroke="#34d399" fill="url(#ge)" strokeWidth={2} />
            <Area type="monotone" dataKey="loan" name="Total Loan" stroke="#f87171" fill="none" strokeWidth={1.5} strokeDasharray="4 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Interest type summary */}
      <div style={{ display: 'flex', gap: 10 }}>
        {Object.entries(interestTypes).map(([type, count]) => (
          <div key={type} className="card-sm" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className={`tag tag-${type === 'fixed' ? 'blue' : type === 'variable' ? 'green' : 'amber'}`}>{type}</span>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>{count} {count === 1 ? 'property' : 'properties'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
