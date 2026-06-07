import { MECHANICS } from '../../data/mockData'

export default function HandoverModal({ liftId, currentMechanicId, onConfirm, onClose }) {
  const available = MECHANICS.filter(m => m.id !== currentMechanicId)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>리프트 {liftId}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.3px' }}>인계</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: '#f2f2f7', border: 'none', cursor: 'pointer', fontSize: 16, color: '#8e8e93', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <p style={{ fontSize: 13, color: '#8e8e93', padding: '0 24px', margin: '0 0 16px' }}>
          작업 내역은 그대로 유지되며 담당자만 변경됩니다.
        </p>

        <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {available.map(m => (
            <button
              key={m.id}
              onClick={() => onConfirm(m.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px', borderRadius: 16, border: '1.5px solid #e5e5ea',
                background: '#fafafa', cursor: 'pointer', transition: 'all 0.15s',
                textAlign: 'left'
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: m.grade === 'A' ? 'linear-gradient(135deg, #ff9500, #ff6b00)' : 'linear-gradient(135deg, #007aff, #0051d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0
              }}>
                {m.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#1c1c1e' }}>{m.name}</div>
                <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>
                  {m.grade === 'A' ? 'A급 · 수석 정비사' : 'B급 · 정비사'}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', color: '#c7c7cc', fontSize: 18 }}>›</div>
            </button>
          ))}
        </div>

        <div style={{ height: 32 }} />
      </div>
    </div>
  )
}
