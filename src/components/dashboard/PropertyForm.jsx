import { useState } from 'react'

const DEFAULTS = {
  nickname: '', address: '', suburb: '', state: '', postcode: '',
  property_type: 'residential',
  purchase_price: '', purchase_date: '', current_valuation: '', last_valuation_date: '',
  loan_amount: '', interest_rate: '', interest_type: 'variable', loan_term_years: '', loan_start_date: '',
  weekly_rent: '', is_vacant: false, annual_expenses: '',
  airbnb_enabled: false, airbnb_nightly_rate: '', airbnb_occupancy_rate: '',
  notes: ''
}

export default function PropertyForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...DEFAULTS, ...initial })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      // Coerce numeric fields
      const data = { ...form }
      const nums = ['purchase_price','current_valuation','loan_amount','interest_rate','loan_term_years','weekly_rent','annual_expenses','airbnb_nightly_rate','airbnb_occupancy_rate']
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

  const Input = ({ field, type = 'text', placeholder, ...rest }) => (
    <input id={field} className="input" type={type} placeholder={placeholder}
      value={form[field] ?? ''} onChange={e => set(field, e.target.value)} {...rest} />
  )

  const Select = ({ field, children }) => (
    <select id={field} className="input" value={form[field]} onChange={e => set(field, e.target.value)}
      style={{ appearance: 'none' }}>
      {children}
    </select>
  )

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
        Property Details
      </div>
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

      <div className="divider" />
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
        Purchase & Valuation
      </div>
      <div className="form-grid" style={{ marginBottom: 20 }}>
        <F label="Purchase price ($)" id="purchase_price"><Input field="purchase_price" type="number" placeholder="750000" /></F>
        <F label="Purchase date" id="purchase_date"><Input field="purchase_date" type="date" /></F>
        <F label="Current valuation ($)" id="current_valuation"><Input field="current_valuation" type="number" placeholder="900000" /></F>
        <F label="Valuation date" id="last_valuation_date"><Input field="last_valuation_date" type="date" /></F>
      </div>

      <div className="divider" />
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
        Loan Details
      </div>
      <div className="form-grid" style={{ marginBottom: 20 }}>
        <F label="Loan amount ($)" id="loan_amount"><Input field="loan_amount" type="number" placeholder="600000" /></F>
        <F label="Interest rate (% p.a.)" id="interest_rate"><Input field="interest_rate" type="number" step="0.01" placeholder="6.25" /></F>
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
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
        Rental Income
      </div>
      <div className="form-grid" style={{ marginBottom: 20 }}>
        <F label="Weekly rent ($)" id="weekly_rent"><Input field="weekly_rent" type="number" placeholder="650" /></F>
        <F label="Annual expenses ($)" id="annual_expenses"><Input field="annual_expenses" type="number" placeholder="12000" /></F>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
          <input type="checkbox" id="is_vacant" checked={form.is_vacant} onChange={e => set('is_vacant', e.target.checked)} />
          <label htmlFor="is_vacant" style={{ fontSize: 13, color: 'var(--text2)' }}>Currently vacant</label>
        </div>
      </div>

      <div className="divider" />
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
        Airbnb / Short Stay
      </div>
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
