import { useState, useEffect, useCallback } from 'react'
import { paymentApi } from '../api/client'

function elapsed(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000)
  return m < 1 ? '방금 전' : m < 60 ? `${m}분 전` : `${Math.floor(m/60)}시간 전`
}

export default function CashApprovalBoard() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)  // paymentId

  const fetchPending = useCallback(async () => {
    try {
      const data = await paymentApi.getPendingFull()
      setPending(data || [])
    } catch (e) {
      console.warn('승인 대기 조회 실패:', e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPending()
    const interval = setInterval(fetchPending, 5000)
    return () => clearInterval(interval)
  }, [fetchPending])

  const handleApprove = async (id) => {
    setProcessing(id)
    try {
      await paymentApi.approve(id)
      setPending(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      alert(`승인 실패: ${e.message}`)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id) => {
    const reason = prompt('반려 사유를 입력하세요 (선택):') ?? ''
    setProcessing(id)
    try {
      await paymentApi.reject(id, reason)
      setPending(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      alert(`반려 실패: ${e.message}`)
    } finally {
      setProcessing(null)
    }
  }

  if (loading) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#8e8e93' }}>불러오는 중...</div>
  )

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'20px 16px 60px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:20, fontWeight:800, color:'#1c1c1e' }}>💵 현금 결제 승인</div>
        <div style={{ fontSize:13, color:'#8e8e93', marginTop:4 }}>
          {pending.length === 0 ? '승인 대기 없음' : `${pending.length}건 승인 대기 중`}
        </div>
      </div>

      {pending.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:20, padding:'48px', textAlign:'center',
          boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
          <div style={{ fontSize:16, fontWeight:700, color:'#1c1c1e' }}>모두 처리됐습니다</div>
          <div style={{ fontSize:13, color:'#8e8e93', marginTop:6 }}>승인 대기 중인 현금 결제가 없습니다</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {pending.map(p => (
            <div key={p.id} style={{ background:'#fff', borderRadius:20, overflow:'hidden',
              boxShadow:'0 1px 3px rgba(0,0,0,0.07)', border:'1.5px solid #ff9500' }}>
              {/* Header */}
              <div style={{ background:'#fff8e6', padding:'14px 18px 12px', borderBottom:'1px solid #ffecc7' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:11, fontWeight:800, color:'#cc7700', letterSpacing:'0.06em' }}>
                    💵 현금 결제 승인 요청
                  </div>
                  <div style={{ fontSize:11, color:'#aeaeb2' }}>
                    {p.requestedAt ? elapsed(p.requestedAt) : ''}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding:'16px 18px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div>
                    <div style={{ fontSize:22, fontWeight:900, color:'#1c1c1e', letterSpacing:'0.04em' }}>
                      {p.order?.vehicle?.plateNumber || '-'}
                    </div>
                    <div style={{ fontSize:13, color:'#3c3c43', marginTop:2 }}>
                      {p.order?.vehicle?.model || ''} · 담당: {p.requestedBy?.name || '-'}
                    </div>
                  </div>
                  <div style={{ fontSize:26, fontWeight:900, color:'#1c1c1e', fontVariantNumeric:'tabular-nums' }}>
                    {p.amount?.toLocaleString()}<span style={{ fontSize:13, fontWeight:400 }}>원</span>
                  </div>
                </div>

                {/* 정비 항목 */}
                {p.order?.items?.length > 0 && (
                  <div style={{ background:'#f9f9fb', borderRadius:12, padding:'10px 14px', marginBottom:14 }}>
                    {p.order.items.map((item, i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between',
                        fontSize:13, padding:'3px 0',
                        borderBottom: i < p.order.items.length-1 ? '1px dashed #f2f2f7' : 'none' }}>
                        <span style={{ color:'#3c3c43' }}>{item.name}</span>
                        <span style={{ fontWeight:600, fontVariantNumeric:'tabular-nums' }}>
                          {item.totalPrice?.toLocaleString()}원
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 승인/반려 버튼 */}
                <div style={{ display:'flex', gap:8 }}>
                  <button
                    onClick={() => handleReject(p.id)}
                    disabled={processing === p.id}
                    style={{
                      flex:1, padding:'12px', borderRadius:12, border:'1.5px solid #ff3b30',
                      background:'#fff', color:'#ff3b30', fontSize:14, fontWeight:700,
                      cursor:'pointer', fontFamily:'inherit',
                      opacity: processing === p.id ? 0.5 : 1,
                    }}
                  >
                    반려
                  </button>
                  <button
                    onClick={() => handleApprove(p.id)}
                    disabled={processing === p.id}
                    style={{
                      flex:2, padding:'12px', borderRadius:12, border:'none',
                      background:'#34c759', color:'#fff', fontSize:14, fontWeight:700,
                      cursor:'pointer', fontFamily:'inherit',
                      opacity: processing === p.id ? 0.5 : 1,
                    }}
                  >
                    {processing === p.id ? '처리 중...' : '✓ 승인'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
