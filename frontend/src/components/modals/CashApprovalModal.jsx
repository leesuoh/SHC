import { MECHANICS } from '../../data/mockData'

export default function CashApprovalModal({ lift, onApprove, onClose }) {
  const mechanic = MECHANICS.find(m => m.id === lift.mechanicId)
  const totalAmount = lift.payment?.amount ?? 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: '#ff3b30', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
              🔒 관리자 확인 필요
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.3px' }}>현금 결제 승인</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: '#f2f2f7', border: 'none', cursor: 'pointer', fontSize: 16, color: '#8e8e93', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Info card */}
        <div style={{ margin: '0 24px', background: '#f2f2f7', borderRadius: 16, overflow: 'hidden' }}>
          {[
            { label: '리프트', value: `${lift.id}번` },
            { label: '차량 번호', value: lift.vehicle?.plateNumber, mono: true },
            { label: '담당 정비사', value: mechanic?.name },
            { label: '결제 수단', value: '💵 현금', accent: '#ff9500' },
          ].map((row, i, arr) => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '13px 16px',
              borderBottom: i < arr.length - 1 ? '1px solid #e5e5ea' : 'none'
            }}>
              <span style={{ fontSize: 14, color: '#8e8e93' }}>{row.label}</span>
              <span style={{
                fontSize: 14, fontWeight: 600,
                color: row.accent || '#1c1c1e',
                fontFamily: row.mono ? 'ui-monospace, monospace' : 'inherit'
              }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Tasks */}
        <div style={{ margin: '12px 24px 0', background: '#f2f2f7', borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>청구 항목</div>
          {lift.tasks.map((task, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
              <span style={{ color: '#3c3c43' }}>{task.name}</span>
              <span style={{ fontWeight: 500, color: '#1c1c1e', fontVariantNumeric: 'tabular-nums' }}>{task.price.toLocaleString()}원</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #e5e5ea', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1c1c1e' }}>합계</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#1c1c1e', fontVariantNumeric: 'tabular-nums' }}>
              {totalAmount.toLocaleString()}원
            </span>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#aeaeb2', padding: '12px 24px 0', lineHeight: 1.6 }}>
          실제 수령한 현금과 위 금액을 확인한 후 승인하세요.
        </p>

        <div style={{ padding: '16px 24px 32px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
          <button onClick={onClose} className="btn btn-gray" style={{ fontSize: 15 }}>취소</button>
          <button onClick={onApprove} className="btn btn-green" style={{ fontSize: 15 }}>✓ 승인 완료</button>
        </div>
      </div>
    </div>
  )
}
