import { useState } from 'react'
import { MECHANICS } from '../../data/mockData'

export default function VehicleEntryModal({ liftId, onConfirm, onClose }) {
  const [plateNumber, setPlateNumber] = useState('')
  const [model, setModel] = useState('')
  const [mechanicId, setMechanicId] = useState(MECHANICS[0].id)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!plateNumber.trim()) return
    onConfirm({ plateNumber: plateNumber.trim().toUpperCase(), model: model.trim() }, mechanicId)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                리프트 {liftId}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.3px' }}>차량 입차</div>
            </div>
            <button
              onClick={onClose}
              style={{ width: 30, height: 30, borderRadius: '50%', background: '#f2f2f7', border: 'none', cursor: 'pointer', fontSize: 16, color: '#8e8e93', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >✕</button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div>
              <div style={{ fontSize: 12, color: '#8e8e93', fontWeight: 600, marginBottom: 6, letterSpacing: '0.04em' }}>차량 번호</div>
              <input
                autoFocus
                type="text"
                value={plateNumber}
                onChange={e => setPlateNumber(e.target.value)}
                placeholder="12가 3456"
                className="input-apple"
                style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center' }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, color: '#8e8e93', fontWeight: 600, marginBottom: 6, letterSpacing: '0.04em' }}>차종 (선택)</div>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="현대 아반떼"
                className="input-apple"
              />
            </div>

            <div>
              <div style={{ fontSize: 12, color: '#8e8e93', fontWeight: 600, marginBottom: 8, letterSpacing: '0.04em' }}>담당 정비사</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {MECHANICS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMechanicId(m.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 16px', borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: mechanicId === m.id ? '#e8f0ff' : '#f2f2f7',
                      transition: 'all 0.15s',
                      outline: mechanicId === m.id ? '1.5px solid #007aff' : 'none',
                    }}
                  >
                    <span className={m.grade === 'A' ? 'grade-a' : 'grade-b'}>{m.grade}</span>
                    <span style={{ fontSize: 15, fontWeight: 500, color: '#1c1c1e' }}>{m.name}</span>
                    {mechanicId === m.id && (
                      <span style={{ marginLeft: 'auto', color: '#007aff', fontSize: 16 }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div style={{ padding: '20px 24px 32px', marginTop: 8 }}>
            <button
              type="submit"
              disabled={!plateNumber.trim()}
              className="btn btn-blue"
              style={{ width: '100%', fontSize: 16 }}
            >
              입차 등록
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
