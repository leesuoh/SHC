import { useState, useEffect } from 'react'
import { MECHANICS } from '../data/mockData'

export default function Header({ currentUser, onUserChange, pendingCashCount }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = time.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

  return (
    <header className="header sticky top-0 z-40 px-4 py-3">
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(145deg, #007aff, #0051d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 2px 8px rgba(0,122,255,0.35)'
          }}>🔧</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.3px', lineHeight: 1.1 }}>SHC</div>
            <div style={{ fontSize: 11, color: '#8e8e93', lineHeight: 1.2 }}>{dateStr}</div>
          </div>
        </div>

        {/* Clock */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1c1c1e', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}>
            {timeStr}
          </div>
          {pendingCashCount > 0 && (
            <div style={{ fontSize: 11, color: '#ff3b30', fontWeight: 600, animation: 'pulse-badge 1.5s infinite' }}>
              현금 승인 대기 {pendingCashCount}건
            </div>
          )}
        </div>

        {/* User switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            background: 'linear-gradient(135deg, #007aff, #0051d4)',
            borderRadius: 12, padding: '6px 14px',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <select
              value={currentUser.id}
              onChange={e => onUserChange(Number(e.target.value))}
              className="select-apple"
            >
              {MECHANICS.map(m => (
                <option key={m.id} value={m.id} style={{ background: '#1c1c1e', color: 'white' }}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>
    </header>
  )
}
