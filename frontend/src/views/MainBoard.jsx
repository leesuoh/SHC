import { useState, useEffect, useCallback } from 'react'
import { MECHANICS, PAYMENT_TYPES } from '../data/mockData'
import { orderApi } from '../api/client'

function elapsed(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000)
  return m < 60 ? `${m}분 전` : `${Math.floor(m/60)}시간 ${m%60}분 전`
}

const STATUS_MAP = {
  IN_PROGRESS: { label: '정비 중',  dotClass: 'dot-progress' },
  PAID:        { label: '결제 완료', dotClass: 'dot-done' },
  CREDIT:      { label: '미수',     dotClass: 'dot-credit' },
}

export default function MainBoard({ onNew, onLookup, onOpenOrder, onCashApproval, currentUser }) {
  const [revenueVisible, setRevenueVisible] = useState(false)
  const [orders, setOrders]                 = useState([])
  const [loading, setLoading]               = useState(true)

  const isAdmin = currentUser.role === 'admin'
  const today = new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'long' })

  // 오늘의 정비 목록 fetch
  const fetchOrders = useCallback(async () => {
    try {
      const data = await orderApi.getToday()
      setOrders(data)
    } catch (e) {
      console.warn('API 연결 실패, mock 데이터 사용:', e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // 초기 로드 + 3초 폴링
  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 3000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const visibleOrders = orders
  const totalRevenue = orders.filter(o => o.status === 'PAID').reduce((s, o) => s + o.totalPrice, 0)
  const inProgressCount = visibleOrders.filter(o => o.status === 'IN_PROGRESS').length

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'20px 16px 60px' }}>

      {/* ── 인사 + 날짜 ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:13, color:'#8e8e93', marginBottom:4 }}>{today}</div>
        <div style={{ fontSize:26, fontWeight:800, color:'#1c1c1e', letterSpacing:'-0.6px', lineHeight:1.2 }}>
          안녕하세요, {currentUser.name}님 👋
        </div>
      </div>

      {/* ── 통계 카드 ── */}
      <div style={{ display:'grid', gridTemplateColumns: isAdmin ? 'repeat(3,1fr)' : 'repeat(2,1fr)', gap:10, marginBottom:20 }}>

        {/* 오늘 작업 */}
        <div style={{ background:'#fff', borderRadius:16, padding:'16px 14px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:10, color:'#8e8e93', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6 }}>오늘 작업</div>
          <div style={{ fontSize:30, fontWeight:800, color:'#1c1c1e', letterSpacing:'-0.5px', lineHeight:1 }}>
            {visibleOrders.length}<span style={{ fontSize:13, fontWeight:500, marginLeft:2, color:'#8e8e93' }}>건</span>
          </div>
        </div>

        {/* 정비 중 */}
        <div style={{ background:'#fff', borderRadius:16, padding:'16px 14px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:10, color:'#8e8e93', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6 }}>정비 중</div>
          <div style={{ fontSize:30, fontWeight:800, color:'#007aff', letterSpacing:'-0.5px', lineHeight:1 }}>
            {inProgressCount}<span style={{ fontSize:13, fontWeight:500, marginLeft:2, color:'#8e8e93' }}>건</span>
          </div>
        </div>

        {/* 오늘 매출 — 사장님 전용, 탭하면 보임 */}
        {isAdmin && (
          <button
            onClick={() => setRevenueVisible(v => !v)}
            style={{
              background: revenueVisible ? '#fff' : 'linear-gradient(135deg,#1c1c1e,#3a3a3c)',
              borderRadius:16, padding:'16px 14px',
              boxShadow:'0 1px 3px rgba(0,0,0,0.08)',
              border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left',
              transition:'all 0.2s ease'
            }}
          >
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6, color: revenueVisible ? '#8e8e93' : 'rgba(255,255,255,0.5)' }}>
              오늘 매출
            </div>
            {revenueVisible ? (
              <div style={{ fontSize:22, fontWeight:800, color:'#34c759', letterSpacing:'-0.5px', lineHeight:1 }}>
                {(totalRevenue/10000).toFixed(0)}<span style={{ fontSize:12, fontWeight:500, marginLeft:2, color:'#8e8e93' }}>만원</span>
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:20 }}>🔒</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:500 }}>탭하여 확인</span>
              </div>
            )}
          </button>
        )}
      </div>

      {/* ── 사장님 전용: 현금 승인 배너 ── */}
      {isAdmin && (
        <button onClick={onCashApproval} style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          background:'linear-gradient(135deg,#ff9500,#ff6b00)', borderRadius:16, padding:'14px 18px',
          border:'none', cursor:'pointer', fontFamily:'inherit', marginBottom:16,
          boxShadow:'0 2px 12px rgba(255,149,0,0.25)'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:22 }}>💵</span>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>현금 결제 승인</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.8)', marginTop:1 }}>대기 중인 현금 결제를 확인하세요</div>
            </div>
          </div>
          <div style={{ fontSize:18, color:'rgba(255,255,255,0.8)' }}>›</div>
        </button>
      )}

      {/* ── CTA 버튼 ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:28 }}>
        <button onClick={onNew} className="main-card" style={{ padding:'22px 20px', textAlign:'left', border:'none', cursor:'pointer' }}>
          <div style={{ fontSize:26, marginBottom:8 }}>📋</div>
          <div style={{ fontSize:16, fontWeight:700, color:'#1c1c1e', marginBottom:4 }}>신규 등록</div>
          <div style={{ fontSize:12, color:'#8e8e93', lineHeight:1.5 }}>새 차량 정비<br />내역서 작성</div>
          <div style={{ marginTop:14, display:'inline-flex', alignItems:'center', gap:4, background:'#007aff', color:'#fff', fontSize:12, fontWeight:700, padding:'6px 12px', borderRadius:8 }}>
            시작 →
          </div>
        </button>

        <button onClick={onLookup} className="main-card" style={{ padding:'22px 20px', textAlign:'left', border:'none', cursor:'pointer' }}>
          <div style={{ fontSize:26, marginBottom:8 }}>🔍</div>
          <div style={{ fontSize:16, fontWeight:700, color:'#1c1c1e', marginBottom:4 }}>차량 조회</div>
          <div style={{ fontSize:12, color:'#8e8e93', lineHeight:1.5 }}>번호판으로<br />정비 이력 검색</div>
          <div style={{ marginTop:14, display:'inline-flex', alignItems:'center', gap:4, background:'#f2f2f7', color:'#1c1c1e', fontSize:12, fontWeight:700, padding:'6px 12px', borderRadius:8 }}>
            조회하기 →
          </div>
        </button>
      </div>

      {/* ── 오늘의 정비 목록 ── */}
      <div style={{ marginBottom:10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:17, fontWeight:700, color:'#1c1c1e' }}>
          {isAdmin ? '오늘의 정비' : '내 담당 정비'}
        </div>
        <span style={{ fontSize:12, color:'#8e8e93' }}>{visibleOrders.length}건</span>
      </div>

      <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>
        {visibleOrders.length === 0 ? (
          <div style={{ padding:'40px', textAlign:'center', color:'#c7c7cc', fontSize:14 }}>
            {isAdmin ? '오늘 등록된 정비가 없습니다' : '오늘 담당한 정비가 없습니다'}
          </div>
        ) : (
          visibleOrders.map(order => {
            const mechanic = order.mechanic
            const total = order.totalPrice
            const st = STATUS_MAP[order.status] || STATUS_MAP.IN_PROGRESS
            const payType = order.payment ? PAYMENT_TYPES.find(p => p.key === order.payment.paymentType) : null
            return (
              <div key={order.id} className="order-item" onClick={() => onOpenOrder(order)}>
                <div className={`dot ${st.dotClass}`} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:16, fontWeight:800, letterSpacing:'0.03em', color:'#1c1c1e' }}>
                      {order.plateNumber}
                    </span>
                    {order.model && <span style={{ fontSize:12, color:'#8e8e93' }}>{order.model}</span>}
                  </div>
                  <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontSize:12, color:'#aeaeb2' }}>{elapsed(order.createdAt)}</span>
                    {mechanic && (
                      <span style={{ fontSize:12, color:'#3c3c43', display:'flex', alignItems:'center', gap:4 }}>
                        <span className={mechanic.grade === 'A' ? 'grade-a' : 'grade-b'}>{mechanic.grade}</span>
                        {mechanic.name}
                      </span>
                    )}
                    {loading && <span style={{ fontSize:11, color:'#c7c7cc' }}>동기화 중...</span>}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#1c1c1e', fontVariantNumeric:'tabular-nums' }}>
                    {total.toLocaleString()}<span style={{ fontSize:11, fontWeight:400, marginLeft:1 }}>원</span>
                  </div>
                  <div style={{ fontSize:11, color: order.paymentType ? '#34c759' : '#ff9500', fontWeight:600, marginTop:2 }}>
                    {payType ? `${payType.icon} ${payType.label}` : st.label}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
