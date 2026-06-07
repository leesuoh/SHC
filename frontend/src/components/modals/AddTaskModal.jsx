import { useState } from 'react'
import { TASK_PRESETS } from '../../data/mockData'

export default function AddTaskModal({ liftId, onConfirm, onClose }) {
  const [selected, setSelected] = useState(new Set())
  const [customName, setCustomName] = useState('')
  const [customPrice, setCustomPrice] = useState('')

  const toggle = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const handleSubmit = () => {
    const tasks = []
    TASK_PRESETS.filter(p => selected.has(p.id)).forEach(p => tasks.push({ name: p.name, price: p.price }))
    if (customName.trim()) tasks.push({ name: customName.trim(), price: Number(customPrice) || 0 })
    if (!tasks.length) return
    onConfirm(tasks)
  }

  const canSubmit = selected.size > 0 || customName.trim()
  const totalCount = selected.size + (customName.trim() ? 1 : 0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
              리프트 {liftId}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.3px' }}>작업 추가</div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: '50%', background: '#f2f2f7', border: 'none', cursor: 'pointer', fontSize: 16, color: '#8e8e93', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        </div>

        <div style={{ padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {TASK_PRESETS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={`preset-btn ${selected.has(p.id) ? 'selected' : ''}`}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: selected.has(p.id) ? '#007aff' : '#1c1c1e', lineHeight: 1.3 }}>
                {p.name}
              </span>
              <span style={{ fontSize: 12, color: selected.has(p.id) ? '#4da3ff' : '#8e8e93', marginTop: 4 }}>
                {p.price.toLocaleString()}원
              </span>
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 24px 0', borderTop: '1px solid #f2f2f7', marginTop: 16 }}>
          <div style={{ fontSize: 12, color: '#8e8e93', fontWeight: 600, marginBottom: 8, letterSpacing: '0.04em' }}>직접 입력</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="작업명"
              className="input-apple-sm"
              style={{ flex: 1 }}
            />
            <input
              type="number"
              value={customPrice}
              onChange={e => setCustomPrice(e.target.value)}
              placeholder="금액"
              className="input-apple-sm"
              style={{ width: 100 }}
            />
          </div>
        </div>

        <div style={{ padding: '16px 24px 32px' }}>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="btn btn-blue"
            style={{ width: '100%', fontSize: 16 }}
          >
            {totalCount > 0 ? `${totalCount}개 작업 추가` : '작업 추가'}
          </button>
        </div>
      </div>
    </div>
  )
}
