import { useState } from 'react'
import { LIFT_STATUS, MECHANICS, PAYMENT_METHODS } from '../data/mockData'
import VehicleEntryModal from './modals/VehicleEntryModal'
import AddTaskModal from './modals/AddTaskModal'
import HandoverModal from './modals/HandoverModal'
import PaymentModal from './modals/PaymentModal'
import CashApprovalModal from './modals/CashApprovalModal'

const STATUS_META = {
  [LIFT_STATUS.EMPTY]:        { label: '빈 리프트',      badgeClass: 'badge-empty',    cardClass: 'card-lift-empty',        dot: '#d1d1d6' },
  [LIFT_STATUS.IN_PROGRESS]:  { label: '정비 중',        badgeClass: 'badge-progress', cardClass: 'card-lift-in-progress',  dot: '#007aff' },
  [LIFT_STATUS.PENDING_CASH]: { label: '현금 승인 대기', badgeClass: 'badge-cash',     cardClass: 'card-lift-pending-cash cash-ring', dot: '#ff3b30' },
  [LIFT_STATUS.COMPLETED]:    { label: '결제 완료',      badgeClass: 'badge-done',     cardClass: 'card-lift-completed',    dot: '#34c759' },
}

function elapsed(isoDate) {
  const mins = Math.floor((Date.now() - new Date(isoDate)) / 60000)
  if (mins < 60) return `${mins}분`
  return `${Math.floor(mins / 60)}시간 ${mins % 60}분`
}

export default function LiftCard({ lift, currentUser, onUpdate }) {
  const [modal, setModal] = useState(null)
  const meta = STATUS_META[lift.status]
  const mechanic = MECHANICS.find(m => m.id === lift.mechanicId)
  const totalAmount = lift.tasks.reduce((s, t) => s + t.price, 0)
  const canApprove = currentUser.role === 'admin'

  const handleEntry = (vehicle, mechanicId) => {
    onUpdate(lift.id, { status: LIFT_STATUS.IN_PROGRESS, vehicle, mechanicId, enteredAt: new Date().toISOString(), tasks: [], notes: '', payment: null })
    setModal(null)
  }

  const handleAddTasks = (newTasks) => {
    const maxId = lift.tasks.reduce((m, t) => Math.max(m, t.id), 0)
    const tasks = [...lift.tasks, ...newTasks.map((t, i) => ({ ...t, id: maxId + i + 1, completed: false }))]
    onUpdate(lift.id, { tasks })
    setModal(null)
  }

  const handleToggleTask = (taskId) => {
    const tasks = lift.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    onUpdate(lift.id, { tasks })
  }

  const handleHandover = (newMechanicId) => {
    onUpdate(lift.id, { mechanicId: newMechanicId })
    setModal(null)
  }

  const handlePayment = (method) => {
    if (method === 'CASH') {
      onUpdate(lift.id, { status: LIFT_STATUS.PENDING_CASH, payment: { method: 'CASH', amount: totalAmount, requestedAt: new Date().toISOString() } })
    } else {
      onUpdate(lift.id, { status: LIFT_STATUS.COMPLETED, payment: { method, amount: totalAmount, completedAt: new Date().toISOString() } })
    }
    setModal(null)
  }

  const handleCashApprove = () => {
    onUpdate(lift.id, { status: LIFT_STATUS.COMPLETED, payment: { ...lift.payment, approvedAt: new Date().toISOString() } })
    setModal(null)
  }

  const handleCheckout = () => {
    onUpdate(lift.id, { status: LIFT_STATUS.EMPTY, vehicle: null, tasks: [], mechanicId: null, enteredAt: null, notes: '', payment: null })
  }

  return (
    <>
      <div className={`card-lift ${meta.cardClass}`}>

        {/* ── Header row ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#8e8e93' }}>리프트 {lift.id}</span>
            <span className={`badge ${meta.badgeClass}`}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, display: 'inline-block', flexShrink: 0 }} />
              {meta.label}
            </span>
          </div>
          {lift.enteredAt && (
            <span style={{ fontSize: 12, color: '#aeaeb2' }}>{elapsed(lift.enteredAt)}</span>
          )}
        </div>

        {/* ── Empty state ── */}
        {lift.status === LIFT_STATUS.EMPTY && (
          <button
            onClick={() => setModal('entry')}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '32px 0', background: 'transparent', border: 'none', cursor: 'pointer',
              gap: 6, borderRadius: 12
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: '#f2f2f7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
            }}>+</div>
            <span style={{ fontSize: 14, color: '#8e8e93', fontWeight: 500 }}>차량 입차</span>
          </button>
        )}

        {/* ── Active content ── */}
        {lift.status !== LIFT_STATUS.EMPTY && (
          <>
            {/* Vehicle + Mechanic */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="plate-number">{lift.vehicle?.plateNumber}</div>
                {lift.vehicle?.model && (
                  <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 2 }}>{lift.vehicle.model}</div>
                )}
              </div>
              {mechanic && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={mechanic.grade === 'A' ? 'grade-a' : 'grade-b'}>{mechanic.grade}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#3c3c43' }}>{mechanic.name}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="divider" />

            {/* Task list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 40 }}>
              {lift.tasks.length === 0 && (
                <p style={{ fontSize: 13, color: '#c7c7cc', textAlign: 'center', margin: '8px 0' }}>작업 항목을 추가하세요</p>
              )}
              {lift.tasks.map(task => (
                <div
                  key={task.id}
                  className="task-row"
                  onClick={() => lift.status === LIFT_STATUS.IN_PROGRESS && handleToggleTask(task.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div className={`task-check ${task.completed ? 'checked' : ''}`}>
                      {task.completed && (
                        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                          <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: 400,
                      color: task.completed ? '#c7c7cc' : '#1c1c1e',
                      textDecoration: task.completed ? 'line-through' : 'none',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {task.name}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 14, fontWeight: 500, flexShrink: 0,
                    color: task.completed ? '#c7c7cc' : '#3c3c43',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {task.price.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            {lift.tasks.length > 0 && (
              <>
                <div className="divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#8e8e93' }}>합계</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.5px' }}>
                    {totalAmount.toLocaleString()}<span style={{ fontSize: 14, fontWeight: 400, marginLeft: 2 }}>원</span>
                  </span>
                </div>
              </>
            )}

            {/* Payment info */}
            {lift.status === LIFT_STATUS.COMPLETED && lift.payment && (
              <div style={{
                background: '#f0fdf4', borderRadius: 12, padding: '10px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: 13, color: '#8e8e93' }}>결제 수단</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#34c759' }}>
                  {PAYMENT_METHODS[lift.payment.method]?.icon} {PAYMENT_METHODS[lift.payment.method]?.label}
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              {lift.status === LIFT_STATUS.IN_PROGRESS && (
                <>
                  <button onClick={() => setModal('addTask')} className="btn btn-gray btn-sm" style={{ flex: 1 }}>
                    + 작업
                  </button>
                  <button onClick={() => setModal('handover')} className="btn btn-orange btn-sm" style={{ flex: 1 }}>
                    인계
                  </button>
                  <button
                    onClick={() => lift.tasks.length > 0 && setModal('payment')}
                    disabled={lift.tasks.length === 0}
                    className="btn btn-blue btn-sm"
                    style={{ flex: 1 }}
                  >
                    결제
                  </button>
                </>
              )}

              {lift.status === LIFT_STATUS.PENDING_CASH && (
                canApprove ? (
                  <button onClick={() => setModal('cashApproval')} className="btn btn-red" style={{ flex: 1 }}>
                    🔓 현금 승인
                  </button>
                ) : (
                  <div style={{
                    flex: 1, textAlign: 'center', fontSize: 13, color: '#ff3b30',
                    fontWeight: 600, padding: '10px 0', animation: 'pulse-badge 1.5s infinite'
                  }}>
                    사장님 승인 대기 중…
                  </div>
                )
              )}

              {lift.status === LIFT_STATUS.COMPLETED && (
                <button onClick={handleCheckout} className="btn btn-green" style={{ flex: 1 }}>
                  출차 완료
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {modal === 'entry' && <VehicleEntryModal liftId={lift.id} onConfirm={handleEntry} onClose={() => setModal(null)} />}
      {modal === 'addTask' && <AddTaskModal liftId={lift.id} onConfirm={handleAddTasks} onClose={() => setModal(null)} />}
      {modal === 'handover' && <HandoverModal liftId={lift.id} currentMechanicId={lift.mechanicId} onConfirm={handleHandover} onClose={() => setModal(null)} />}
      {modal === 'payment' && <PaymentModal liftId={lift.id} totalAmount={totalAmount} onConfirm={handlePayment} onClose={() => setModal(null)} />}
      {modal === 'cashApproval' && <CashApprovalModal lift={lift} onApprove={handleCashApprove} onClose={() => setModal(null)} />}
    </>
  )
}
