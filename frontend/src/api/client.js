// ── API 기본 설정 ──
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function getToken() {
  return localStorage.getItem('shc_token')
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(json.message || `HTTP ${res.status}`)
  }

  return json.data
}

// ── Auth ──
export const authApi = {
  login: (name, pin) => request('POST', '/api/auth/login', { name, pin }),
}

// ── Orders ──
export const orderApi = {
  getToday:        ()           => request('GET',   '/api/orders/today'),
  getOne:          (id)         => request('GET',   `/api/orders/${id}`),
  create:          (data)       => request('POST',  '/api/orders', data),
  updateStatus:    (id, status) => request('PATCH', `/api/orders/${id}/status`, { status }),
  getVehicleHistory: (plate)    => request('GET',   `/api/orders/vehicle/${encodeURIComponent(plate)}`),
}

// ── Payments ──
export const paymentApi = {
  create:         (data)       => request('POST', '/api/payments', data),
  approve:        (id)         => request('POST', `/api/payments/${id}/approve`),
  reject:         (id, reason) => request('POST', `/api/payments/${id}/reject`, { reason }),
  getPending:     ()           => request('GET',  '/api/payments/pending'),
  getPendingFull: ()           => request('GET',  '/api/payments/pending/full'),
}
