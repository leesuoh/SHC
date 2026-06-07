import { useState } from 'react'
import { MECHANICS } from '../data/mockData'
import { authApi } from '../api/client'

export default function LoginScreen({ onLogin }) {
  const [selectedId, setSelectedId] = useState(null)
  const [pin, setPin]               = useState('')
  const [error, setError]           = useState('')
  const [shake, setShake]           = useState(false)
  const [loading, setLoading]       = useState(false)

  const selectedMechanic = MECHANICS.find(m => m.id === selectedId)

  const handlePinInput = async (digit) => {
    if (pin.length >= 4 || loading) return
    const next = pin + digit
    setPin(next)
    setError('')

    if (next.length === 4) {
      setLoading(true)
      try {
        // 백엔드 연동: 이름 + PIN → JWT
        const data = await authApi.login(selectedMechanic.name, next)
        localStorage.setItem('shc_token', data.token)
        onLogin(data.mechanic)
      } catch (e) {
        setShake(true)
        setError(e.message || 'PIN이 맞지 않습니다')
        setTimeout(() => { setPin(''); setShake(false) }, 600)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleBack = () => {
    setSelectedId(null)
    setPin('')
    setError('')
  }

  return (
    <div style={{
      minHeight: '100svh',
      background: 'linear-gradient(160deg, #f2f2f7 0%, #e8e8ed 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
    }}>

      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'linear-gradient(145deg,#007aff,#0051d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 34, boxShadow: '0 8px 32px rgba(0,122,255,0.25)',
          margin: '0 auto 14px',
        }}>🔧</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#1c1c1e', letterSpacing: '-0.5px' }}>SHC</div>
        <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 2 }}>시화카 정비소 — 직원 전용</div>
      </div>

      {!selectedId ? (
        /* ── 직원 선택 ── */
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#3c3c43', textAlign: 'center', marginBottom: 16 }}>
            직원을 선택하세요
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MECHANICS.map(m => (
              <button
                key={m.id}
                onClick={() => { setSelectedId(m.id); setPin(''); setError('') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: '#fff', border: '1.5px solid #e5e5ea',
                  borderRadius: 16, padding: '16px 18px',
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'all 0.15s',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: m.role === 'admin'
                    ? 'linear-gradient(135deg,#ff9500,#ff6b00)'
                    : 'linear-gradient(135deg,#5856d6,#007aff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  {m.role === 'admin' ? '👑' : '🔧'}
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1c1c1e' }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>
                    {m.role === 'admin' ? '관리자' : '정비사'} · 등급 {m.grade}
                  </div>
                </div>
                <div style={{ fontSize: 18, color: '#c7c7cc' }}>›</div>
              </button>
            ))}
          </div>
        </div>

      ) : (
        /* ── PIN 입력 ── */
        <div style={{ width: '100%', maxWidth: 320, textAlign: 'center' }}>
          {/* Back */}
          <button
            onClick={handleBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#007aff', fontWeight: 700, fontSize: 15,
              fontFamily: 'inherit', marginBottom: 28, padding: 0,
            }}
          >
            <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
              <path d="M8 1L1.5 7.5L8 14" stroke="#007aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            직원 선택
          </button>

          {/* Avatar + name */}
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: selectedMechanic?.role === 'admin'
              ? 'linear-gradient(135deg,#ff9500,#ff6b00)'
              : 'linear-gradient(135deg,#5856d6,#007aff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 12px',
          }}>
            {selectedMechanic?.role === 'admin' ? '👑' : '🔧'}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1c1c1e', marginBottom: 4 }}>
            {selectedMechanic?.name}
          </div>
          <div style={{ fontSize: 12, color: '#8e8e93', marginBottom: 32 }}>PIN 4자리를 입력하세요</div>

          {/* PIN dots */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 8,
            animation: shake ? 'shake 0.4s ease' : 'none',
          }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width: 16, height: 16, borderRadius: '50%',
                background: i < pin.length
                  ? (error ? '#ff3b30' : '#007aff')
                  : '#d1d1d6',
                transition: 'background 0.12s',
              }} />
            ))}
          </div>
          {error && (
            <div style={{ fontSize: 13, color: '#ff3b30', fontWeight: 600, marginBottom: 8, minHeight: 20 }}>
              {error}
            </div>
          )}
          {!error && <div style={{ minHeight: 28 }} />}

          {/* Numpad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 8 }}>
            {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, idx) => {
              if (k === '') return <div key={idx} />
              return (
                <button
                  key={idx}
                  onClick={() => k === '⌫' ? setPin(p => p.slice(0,-1)) : handlePinInput(String(k))}
                  style={{
                    height: 68, borderRadius: 16,
                    background: k === '⌫' ? '#e5e5ea' : '#fff',
                    border: 'none', cursor: 'pointer',
                    fontSize: k === '⌫' ? 20 : 26,
                    fontWeight: 700, color: '#1c1c1e',
                    fontFamily: 'inherit',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    transition: 'transform 0.08s, background 0.08s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onPointerDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
                  onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {k}
                </button>
              )
            })}
          </div>

          {/* 힌트 */}
          <div style={{ marginTop: 24, fontSize: 11, color: '#aeaeb2' }}>
            {loading ? '로그인 중...' : 'PIN 4자리를 눌러주세요'}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0) }
          20%      { transform: translateX(-8px) }
          40%      { transform: translateX(8px) }
          60%      { transform: translateX(-6px) }
          80%      { transform: translateX(6px) }
        }
      `}</style>
    </div>
  )
}
