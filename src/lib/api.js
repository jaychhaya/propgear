const getToken = () => localStorage.getItem('propgear_token')

export async function apiFetch(path, options = {}) {
  const token = getToken()
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  properties: {
    list: () => apiFetch('/api/properties'),
    get: (id) => apiFetch(`/api/properties/${id}`),
    create: (body) => apiFetch('/api/properties', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiFetch(`/api/properties/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => apiFetch(`/api/properties/${id}`, { method: 'DELETE' })
  },
  research: {
    search: (criteria) => apiFetch('/api/research', { method: 'POST', body: JSON.stringify(criteria) }),
    history: () => apiFetch('/api/research/history')
  }
}
