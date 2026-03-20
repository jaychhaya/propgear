import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { formatCurrency, formatPct, grossYield, equity, lvr } from '../lib/finance.js'
import PropertyForm from '../components/dashboard/PropertyForm.jsx'

export default function PropertiesPage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProperty, setEditProperty] = useState(null)
  const navigate = useNavigate()

  const load = () => {
    api.properties.list()
      .then(d => setProperties(d.properties || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSave = async (data) => {
    if (editProperty) {
      await api.properties.update(editProperty.id, data)
    } else {
      await api.properties.create(data)
    }
    setShowForm(false)
    setEditProperty(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this property?')) return
    await api.properties.delete(id)
    load()
  }

  const openEdit = (p) => { setEditProperty(p); setShowForm(true) }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Properties</h1>
          <div style={{ color: 'var(--text2)', fontSize: 13 }}>{properties.length} in portfolio</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditProperty(null); setShowForm(true) }}>
          + Add property
        </button>
      </div>

      {loading && <div style={{ color: 'var(--text2)' }}>Loading…</div>}

      {!loading && properties.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text2)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>No properties yet</div>
          <div style={{ fontSize: 13 }}>Add your first investment property to get started.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {properties.map(p => {
          const gYield = grossYield(p.weekly_rent, p.current_valuation || p.purchase_price)
          const eq = equity(p.current_valuation || p.purchase_price, p.loan_amount)
          const lvrPct = lvr(p.loan_amount, p.current_valuation || p.purchase_price)

          return (
            <div key={p.id} className="card" style={{ padding: '16px 20px', cursor: 'pointer' }}
              onClick={() => navigate(`/properties/${p.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{p.nickname || p.address}</div>
                    <span className={`tag tag-${p.interest_type === 'fixed' ? 'blue' : p.interest_type === 'split' ? 'amber' : 'green'}`}>
                      {p.interest_type || 'variable'}
                    </span>
                    {p.is_vacant && <span className="tag tag-red">vacant</span>}
                    {p.airbnb_enabled && <span className="tag tag-purple">airbnb</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {p.address}{p.suburb ? `, ${p.suburb}` : ''}{p.state ? ` ${p.state}` : ''}
                  </div>
                </div>

                {/* Key metrics */}
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valuation</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 500 }}>{formatCurrency(p.current_valuation || p.purchase_price)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loan</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>{formatCurrency(p.loan_amount)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Equity</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--green)' }}>{formatCurrency(eq)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Yield</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--amber)' }}>{formatPct(gYield)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LVR</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: lvrPct > 80 ? 'var(--red)' : 'var(--text)' }}>{formatPct(lvrPct)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => handleDelete(p.id)}>Delete</button>
                  </div>
                </div>
              </div>

              {/* Rate bar */}
              {p.interest_rate && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>Interest rate</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>{p.interest_rate}% p.a.</span>
                  {p.weekly_rent && (
                    <>
                      <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 12 }}>Weekly rent</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{formatCurrency(p.weekly_rent)}/wk</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20
        }} onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditProperty(null) } }}>
          <div className="card" style={{
            width: '100%', maxWidth: 680, maxHeight: '90vh',
            overflowY: 'auto', padding: 28
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{editProperty ? 'Edit property' : 'Add property'}</div>
              <button className="btn btn-ghost" style={{ padding: '4px 10px' }} onClick={() => { setShowForm(false); setEditProperty(null) }}>✕</button>
            </div>
            <PropertyForm initial={editProperty} onSave={handleSave} onCancel={() => { setShowForm(false); setEditProperty(null) }} />
          </div>
        </div>
      )}
    </div>
  )
}
