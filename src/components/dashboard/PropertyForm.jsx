import { useState } from 'react'
import { api } from '../../lib/api.js'

const DEFAULTS = {
  nickname: '', address: '', suburb: '', state: '', postcode: '',
  property_type: 'residential',
  bedrooms: '', bathrooms: '', garage: '', land_area_sqm: '', floor_area_sqm: '',
  purchase_price: '', purchase_date: '', current_valuation: '', last_valuation_date: '',
  loan_amount: '', interest_rate: '', interest_type: 'variable', loan_term_years: '', loan_start_date: '',
  weekly_rent: '', is_vacant: false, annual_expenses: '',
  airbnb_enabled: false, airbnb_nightly_rate: '', airbnb_occupancy_rate: '',
  notes: ''
}

function LookupResult({ result, onApply, onDismiss }) {
  const p = result
  return (
    <div style={{
      background: 'var(--bg3)', border: '1px solid rgba(79,156,249,0.25)',
      borderRadius: 10, padding: 16, marginBottom: 20
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 2 }}>◎ Property found</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>From: {p.data_sources?.join(', ')}</div>
        </div>
        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={onDismiss}>✕</button>
      </div>

      {p.description && (
        <div style={{
          background: 'var(--accent-dim)', border: '1px solid rgba(79,156,249,0.15)',
          borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text)', marginBottom: 12
        }}>
          {p.description}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Bedrooms', value: p.bedrooms, icon: '🛏' },
          { label: 'Bathrooms', value: p.bathrooms, icon: '🚿' },
          { label: 'Garage', value: p.garage, icon: '🚗' },
          { label: 'Land area', value: p.land_area_sqm ? `${p.land_area_sqm}m²` : null, icon: '📐' },
          { label: 'Floor area', value: p.floor_area_sqm ? `${p.floor_area_sqm}m²` : null, icon: '🏠' },
        ].filter(i => i.value != null).map(item => (
          <div key={item.label} style={{
            background: 'var(--bg2)', borderRadius: 8, padding: '10px 12px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>{item.icon}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600 }}>{item.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {p.last_sold_price && (
          <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Last sold</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600 }}>${p.last_sold_price?.toLocaleString()}</div>
            {p.last_sold_date && <div style={{ fontSize: 11, color: 'var(--text2)' }}>{p.last_sold_date}</div>}
          </div>
        )}
        {p.current_valuation_estimate && (
          <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Est. valuation</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>${p.current_valuation_estimate?.toLocaleString()}</div>
            {p.valuation_range_low && p.valuation_range_high && (
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                ${(p.valuation_range_low/1000).toFixed(0)}k – ${(p.valuation_range_high/1000).toFixed(0)}k
              </div>
            )}
          </div>
        )}
        {p.weekly_rent_estimate && (
          <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Est. weekly rent</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: 'var(--amber)' }}>${p.weekly_rent_estimate}/wk</div>
          </div>
        )}
      </div>

      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onApply(p)}>
        ↓ Apply these details to form
      </button>
    </div>
  )
}

export default function PropertyForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...DEFAULTS, ...initial })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [lookupAddress, setLookupAddress] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupResult, setLookupResult] = useState(null)
  const [lookupError, setLookupError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleLookup = async () => {
    if (!lookupAddress.trim()) return
    setLookupError('')
    setLookupResult(null)
    setLookupLoading(true)
    try {
      const data = await api.properties.lookup(lookupAddress)
      setLookupResult(data.property)
    } catch (err) {
      setLookupError(err.message)
    } finally {
      setLookupLoading(false)
    }
  }

  const applyLookup = (p) => {
    setForm(f => ({
      ...f,
      address: p.address || f.address,
      suburb: p.suburb || f.suburb,
      state: p.state || f.state,
      postcode: p.postcode || f.postcode,
      property_type: p.property_type || f.property_type,
      bedrooms: p.bedrooms ?? f.bedrooms,
      bathrooms: p.bathrooms ?? f.bathrooms,
      garage: p.garage ?? f.garage,
      land_area_sqm: p.land_area_sqm ?? f.land_area_sqm,
      floor_area_sqm: p.floor_area_sqm ?? f.floor_area_sqm,
      current_valuation: p.current_valuation_estimate ?? f.current_valuation,
      weekly_rent: p.weekly_rent_estimate ?? f.weekly_rent,
      nickname: f.nickname || p.suburb || '',
    }))
    setLookupResult(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const data = { ...form }
      const nums = ['purchase_price','current_valuation','loan_amount','interest_rate','loan_term_years','weekly_rent','annual_expenses','airbnb_nightly_rate','airbnb_occupancy_rate','bedrooms','bathrooms','garage','land_area_sqm','floor_area_sqm']
      nums.forEach(k => { if (data[k] === '' || data[k] == null) data[k] = null; else data[k] = +data[k] })
      await onSave(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const F = ({ label, id, children, span }) => (
    <div className={span ? 'span-2' : ''}>
      <label className="label" htmlFor={id}>{label}</label>
      {children}
    </div>
  )

  const Input = ({ field, type = 'text', placeholder }) => (
    <input id={field} className="input" type={type} placeholder={placeholder}
      value={form[field] ?? ''} onChange={e => set(field, e.target.value)} />
  )

  const Select = ({ field, children }) => (
    <select id={field} className="input" value={form[field]} onChange={e => set(field, e.target.value)}
      style={{ appearance: 'none' }}>
      {children}
    </select>
  )

  return (
    <form onSubmit={handleSubmit}>
      {/* AI Address Lookup */}
      <div style={{
        background: 'var(--bg3)', border: '1px solid var(--border2)',
        borderRadius: 10, padding: 16, marginBottom: 20
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>◎ AI Property Lookup</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
          Enter an address and Claude will search realestate.com.au & domain.com.au to auto-fill property details.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            placeholder="e.g. 12 Smith Street, Bondi NSW 2026"
            value={lookupAddress}
            onChange={e => setLookupAddress(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleLookup())}
            style={{ flex: 1 }}
          />
          <button type="button" className="btn btn-primary" onClick={handleLookup}
            disabled={lookupLoading || !lookupAddress.trim()} style={{ whiteSpace: 'nowrap' }}>
            {lookupLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Looking up…
              </span>
            ) : 'Look up'}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        {lookupError && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--red)' }}>{lookupError}</div>}
      </div>

      {lookupResult && <LookupResult result={lookupResult} onApply={applyLookup} onDismiss={() => setLookupResult(null)} />}

      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Property Details</div>
      <div className="form-grid" style={{ marginBottom: 20 }}>
        <F label="Nickname" id="nickname"><Input field="nickname" placeholder="e.g. Bondi Unit" /></F>
        <F label="Property type" id="property_type">
          <Select field="property_type">
            <option value="residential">Residential</option>
            <option value="unit">Unit / Apartment</option>
            <option value="townhouse">Townhouse</option>
            <option value="commercial">Commercial</option>
            <option value="land">Land</option>
          </Select>
        </F>
        <F label="Address" id="address" span><Input field="address" placeholder="123 Main St" /></F>
        <F label="Suburb" id="suburb"><Input field="suburb" placeholder="Bondi" /></F>
        <F label="State" id="state"><Input field="state" placeholder="NSW" /></F>
        <F label="Postcode" id="postcode"><Input field="postcode" placeholder="2026" /></F>
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Property Configuration</div>
      <div className="form-grid" style={{ marginBottom: 20 }}>
        <F label="Bedrooms" id="bedrooms"><Input field="bedrooms" type="number" placeholder="3" /></F>
        <F label="Bathrooms" id="bathrooms"><Input field="bathrooms" type="number" placeholder="2" /></F>
        <F label="Garage / car spaces" id="garage"><Input field="garage" type="number" placeholder="1" /></F>
        <F label="Land area (m²)" id="land_area_sqm"><Input field="land_area_sqm" type="number" placeholder="650" /></F>
        <F label="Floor area (m²)" id="floor_area_sqm"><Input field="floor_area_sqm" type="number" placeholder="180" /></F>
      </div>

      <div className="divider" />
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Purchase & Valuation</div>
      <div className="form-grid" style={{ marginBottom: 20 }}>
        <F label="Purchase price ($)" id="purchase_price"><Input field="purchase_price" type="number" placeholder="750000" /></F>
        <F label="Purchase date" id="purchase_date"><Input field="purchase_date" type="date" /></F>
        <F label="Current valuation ($)" id="current_valuation"><Input field="current_valuation" type="number" placeholder="900000" /></F>
        <F label="Valuation date" id="last_valuation_date"><Input field="last_valuation_date" type="date" /></F>
      </div>

      <div className="divider" />
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Loan Details</div>
      <div className="form-grid" style={{ marginBottom: 20 }}>
        <F label="Loan amount ($)" id="loan_amount"><Input field="loan_amount" type="number" placeholder="600000" /></F>
        <F label="Interest rate (% p.a.)" id="interest_rate"><Input field="interest_rate" type="number" placeholder="6.25" /></F>
        <F label="Interest type" id="interest_type">
          <Select field="interest_type">
            <option value="variable">Variable</option>
            <option value="fixed">Fixed</option>
            <option value="split">Split</option>
          </Select>
        </F>
        <F label="Loan term (years)" id="loan_term_years"><Input field="loan_term_years" type="number" placeholder="30" /></F>
        <F label="Loan start date" id="loan_start_date"><Input field="loan_start_date" type="date" /></F>
      </div>

      <div className="divider" />
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Rental Income</div>
      <div className="form-grid" style={{ marginBottom: 20 }}>
        <F label="Weekly rent ($)" id="weekly_rent"><Input field="weekly_rent" type="number" placeholder="650" /></F>
        <F label="Annual expenses ($)" id="annual_expenses"><Input field="annual_expenses" type="number" placeholder="12000" /></F>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
          <input type="checkbox" id="is_vacant" checked={form.is_vacant} onChange={e => set('is_vacant', e.target.checked)} />
          <label htmlFor="is_vacant" style={{ fontSize: 13, color: 'var(--text2)' }}>Currently vacant</label>
        </div>
      </div>

      <div className="divider" />
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Airbnb / Short Stay</div>
      <div className="form-grid" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
          <input type="checkbox" id="airbnb_enabled" checked={form.airbnb_enabled} onChange={e => set('airbnb_enabled', e.target.checked)} />
          <label htmlFor="airbnb_enabled" style={{ fontSize: 13, color: 'var(--text2)' }}>Airbnb / short stay enabled</label>
        </div>
        {form.airbnb_enabled && <>
          <F label="Nightly rate ($)" id="airbnb_nightly_rate"><Input field="airbnb_nightly_rate" type="number" placeholder="180" /></F>
          <F label="Occupancy rate (%)" id="airbnb_occupancy_rate"><Input field="airbnb_occupancy_rate" type="number" placeholder="70" /></F>
        </>}
      </div>

      <div className="divider" />
      <div className="form-grid" style={{ marginBottom: 20 }}>
        <F label="Notes" id="notes" span>
          <textarea id="notes" className="input" rows={3} placeholder="Any additional notes…"
            value={form.notes || ''} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
        </F>
      </div>

      {error && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save property'}
        </button>
      </div>
    </form>
  )
}
