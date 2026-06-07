import { useState } from 'react'
import { PAYMENT_METHODS } from '../../data/mockData'

const METHOD_COLORS = {
  CASH:     { bg: '#fff8e6', border: '#ff9500', icon: '💵', accent: '#ff9500' },
  CARD:     { bg: '#e8f0ff', border: '#007aff', icon: '💳', accent: '#007aff' },
  TRANSFER: { bg: '#f0fdf4', border: '#34c759', icon: '🏦', accent: '#34c759' },
}

export default function PaymentModal({ liftId, totalAmount, onConfirm, onClose }) {
  const [method, setMethod] = useState(null)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>리프트 {liftId}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.3px' }}>결제</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: '#f2f2f7', border: 'none', cursor: 'pointer', fontSize: 16, color: '#8e8e93', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Amount */}
        <div style={{ margin: '0 24px 20px', background: '#f2f2f7', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>청구 금액</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#1c1c1e', letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>
            {totalAmount.toLocaleString()}<span style={{ fontSize: 20, fontWeight: 500, marginLeft: 4 }}>원</span>
          </div>
        </div>

        {/* Method selector */}
        <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(PAYMENT_METHODS).map(([key, val]) => {
            const c = METHOD_COLORS[key]
            const isSelected = method === key
            return (
              <button
                key={key}
                onClick={() => setMethod(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px', borderRadius: 16,
                  border: `1.5px solid ${isSelected ? c.border : '#e5e5ea'}`,
                  background: isSelected ? c.bg : '#fafafa',
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left'
                }}
              >
                <div style={{ fontSize: 28, lineHeight: 1 }}>{c.icon}</div>
                <span style={{ fontSize: 16, fontWeight: 600, color: isSelected ? c.accent : '#1c1c1e' }}>
                  {val.label}
                </span>
                {isSelected && (
                  <div style={{
                    marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%',
                    background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                      <path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {method === 'CASH' && (
          <div style={{
            margin: '12px 24px 0',
            background: '#fff5f5', borderRadius: 12, padding: '12px 14px',
            display: 'flex', gap: 8, alignItems: 'flex-start'
          }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <p style={{ fontSize: 13, color: '#ff3b30', margin: 0, lineHeight: 1.5 }}>
              현금 결제 선택 시 사장님의 승인이 있을 때까지 리프트가 잠깁니다.
            </p>
          </div>
        )}

        <div style={{ padding: '16px 24px 32px' }}>
          <button
            onClick={() => method && onConfirm(method)}
            disabled={!method}
            className="btn btn-blue"
            style={{ width: '100%', fontSize: 16 }}
          >
            {method === 'CASH' ? '현금 결제 요청' : '결제 완료'}
          </button>
        </div>
      </div>
    </div>
  )
}
