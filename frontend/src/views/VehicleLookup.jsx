import { useState } from 'react'
import { MECHANICS, PAYMENT_TYPES } from '../data/mockData'
import { orderApi } from '../api/client'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'short' })
}

function daysSince(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
  if (days === 0) return '오늘'
  if (days < 30) return `${days}일 전`
  if (days < 365) return `약 ${Math.floor(days/30)}개월 전`
  return `약 ${Math.floor(days/365)}년 전`
}

function RecordCard({ record, isLatest }) {
  const [open, setOpen] = useState(isLatest)
  const mechanic = record.mechanicName
    ? { name: record.mechanicName, grade: record.mechanicGrade }
    : MECHANICS.find(m => m.id === record.mechanicId)
  const pt = PAYMENT_TYPES.find(p => p.key === record.paymentType)

  return (
    <div style={{
      border: `1.5px solid ${isLatest ? '#007aff' : '#e5e5ea'}`,
      borderRadius:16, overflow:'hidden', background:'#fff',
      boxShadow: isLatest ? '0 2px 12px rgba(0,122,255,0.1)' : 'none'
    }}>
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
          border:'none', background: isLatest ? '#f0f5ff' : '#fff',
          cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'background 0.15s'
        }}
      >
        {/* Date column */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
            {isLatest && (
              <span style={{ fontSize:10, fontWeight:800, background:'#007aff', color:'#fff', padding:'2px 7px', borderRadius:6, letterSpacing:'0.04em', whiteSpace:'nowrap' }}>
                최근
              </span>
            )}
            <span style={{ fontSize:15, fontWeight:700, color:'#1c1c1e' }}>{formatDate(record.date)}</span>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:12, color:'#aeaeb2' }}>{daysSince(record.date)}</span>
            <span style={{ fontSize:12, color:'#3c3c43' }}>주행 {record.mileage} km</span>
            {mechanic && (
              <span style={{ fontSize:12, color:'#8e8e93', display:'flex', alignItems:'center', gap:4 }}>
                <span className={mechanic.grade === 'A' ? 'grade-a' : 'grade-b'} style={{ fontSize:9 }}>{mechanic.grade}</span>
                {mechanic.name}
              </span>
            )}
          </div>
        </div>

        {/* Right: total + payment */}
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:17, fontWeight:800, color:'#1c1c1e', fontVariantNumeric:'tabular-nums' }}>
            {record.total.toLocaleString()}<span style={{ fontSize:11, fontWeight:400, marginLeft:1 }}>원</span>
          </div>
          <div style={{ fontSize:11, fontWeight:600, marginTop:2, color: pt ? '#34c759' : '#ff9500' }}>
            {pt ? `${pt.icon} ${pt.label}` : '⏳ 미결'}
          </div>
        </div>

        <div style={{ fontSize:16, color:'#c7c7cc', transition:'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink:0 }}>⌄</div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div style={{ borderTop:'1px solid #f2f2f7', padding:'12px 16px 14px' }}>
          <div style={{ fontSize:10, fontWeight:800, color:'#8e8e93', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>
            정비 내역
          </div>
          {record.items.map((item, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom: i < record.items.length-1 ? '1px dashed #f2f2f7' : 'none' }}>
              <span style={{ fontSize:14, color:'#3c3c43' }}>{item.name}</span>
              <span style={{ fontSize:14, fontWeight:600, color:'#1c1c1e', fontVariantNumeric:'tabular-nums' }}>
                {item.price.toLocaleString()}원
              </span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, paddingTop:10, borderTop:'1.5px solid #1c1c1e' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#3c3c43' }}>합계</span>
            <span style={{ fontSize:18, fontWeight:900, color:'#1c1c1e', fontVariantNumeric:'tabular-nums' }}>
              {record.total.toLocaleString()}원
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function VehicleLookup({ onBack, onNewOrder }) {
  const [query, setQuery]       = useState('')
  const [result, setResult]     = useState(null)  // { vehicle, records[] }
  const [searched, setSearched] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleSearch = async () => {
    const normalized = query.trim().replace(/\s+/g, ' ')
    if (!normalized) return
    setLoading(true)
    try {
      const records = await orderApi.getVehicleHistory(normalized)
      setSearched(true)
      if (records && records.length > 0) {
        // API 응답에서 차량 정보 추출
        const first = records[0]
        setResult({
          plateNumber: first.plateNumber,
          model: first.model,
          year: first.year,
          vin: first.vin,
          records: records.map(r => ({
            id: String(r.id),
            date: r.createdAt?.split('T')[0] || '',
            mileage: r.mileage ? r.mileage.toLocaleString() : '-',
            mechanicId: r.mechanic?.id,
            mechanicName: r.mechanic?.name,
            mechanicGrade: r.mechanic?.grade,
            items: r.items.map(i => ({ name: i.name, price: i.totalPrice })),
            paymentType: r.payment?.paymentType || null,
            total: r.totalPrice,
          }))
        })
        setNotFound(false)
      } else {
        setResult(null)
        setNotFound(true)
      }
    } catch (e) {
      console.warn('차량 조회 실패:', e.message)
      setResult(null)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const totalSpent   = result ? result.records.reduce((s, r) => s + r.total, 0) : 0
  const latestRecord = result ? result.records[result.records.length - 1] : null
  const latestMileage = latestRecord?.mileage || '-'

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'20px 16px 60px' }}>
      {/* Search card */}
      <div style={{ background:'#fff', borderRadius:20, padding:'20px', marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize:18, fontWeight:700, color:'#1c1c1e', marginBottom:4 }}>🔍 차량 정비 이력 조회</div>
        <div style={{ fontSize:12, color:'#8e8e93', marginBottom:16 }}>차량 등록 번호를 입력하면 과거 정비 내역을 조회합니다</div>

        <div style={{ display:'flex', gap:8 }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="12가 3456"
            autoFocus
            style={{
              flex:1, background:'#f2f2f7', border:'none', borderRadius:12,
              padding:'14px 16px', fontSize:20, fontWeight:800, letterSpacing:'0.06em',
              fontFamily:'inherit', color:'#1c1c1e', outline:'none',
              fontVariantNumeric:'tabular-nums'
            }}
          />
          <button onClick={handleSearch} className="btn btn-blue" style={{ fontSize:15, padding:'12px 20px' }}>
            조회
          </button>
        </div>

        {loading && (
          <div style={{ marginTop:10, fontSize:12, color:'#8e8e93', textAlign:'center' }}>
            조회 중...
          </div>
        )}
      </div>

      {/* Not found */}
      {notFound && (
        <div style={{ background:'#fff', borderRadius:20, padding:'32px 20px', textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🚗</div>
          <div style={{ fontSize:16, fontWeight:700, color:'#1c1c1e', marginBottom:6 }}>정비 이력 없음</div>
          <div style={{ fontSize:13, color:'#8e8e93', marginBottom:20 }}>
            <strong style={{ fontVariantNumeric:'tabular-nums' }}>{query}</strong> 차량의 정비 기록이 없습니다.
          </div>
          <button onClick={() => onNewOrder(query)} className="btn btn-blue" style={{ fontSize:14 }}>
            신규 정비 내역서 작성
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <>
          {/* Vehicle summary card */}
          <div style={{ background:'#fff', borderRadius:20, padding:'20px', marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,0.07)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:26, fontWeight:900, letterSpacing:'0.04em', color:'#1c1c1e', fontVariantNumeric:'tabular-nums' }}>
                  {result.plateNumber}
                </div>
                <div style={{ fontSize:14, color:'#3c3c43', fontWeight:500, marginTop:2 }}>
                  {result.model} · {result.year}년식
                </div>
                {result.vin && (
                  <div style={{ fontSize:11, color:'#aeaeb2', fontFamily:'ui-monospace,monospace', letterSpacing:'0.04em', marginTop:4 }}>
                    VIN: {result.vin}
                  </div>
                )}
              </div>
              <button onClick={() => onNewOrder(result)} className="btn btn-blue btn-sm">
                + 신규 정비
              </button>
            </div>

            {/* Stats row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, borderTop:'1px solid #f2f2f7', paddingTop:14 }}>
              {[
                { label:'정비 횟수',    value: `${result.records.length}회`,              color:'#1c1c1e' },
                { label:'최근 주행거리', value: `${latestMileage} km`,                     color:'#007aff' },
                { label:'누적 결제액',   value: `${(totalSpent/10000).toFixed(0)}만원`,    color:'#34c759' },
              ].map(s => (
                <div key={s.label} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'#8e8e93', fontWeight:600, letterSpacing:'0.04em', textTransform:'uppercase', marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:17, fontWeight:800, color:s.color, fontVariantNumeric:'tabular-nums' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Record list */}
          <div style={{ marginBottom:8, fontSize:13, fontWeight:700, color:'#8e8e93', letterSpacing:'0.04em', textTransform:'uppercase' }}>
            정비 이력 — {result.records.length}건
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[...result.records].reverse().map((rec, i) => (
              <RecordCard key={rec.id} record={rec} isLatest={i === 0} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
