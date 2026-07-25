import { useState } from 'react'
import { MECHANICS, PAYMENT_TYPES } from '../data/mockData'
import { orderApi } from '../api/client'
import CameraGuideModal from '../components/CameraGuideModal'

const OCR_URL = import.meta.env.VITE_OCR_URL ?? ''

async function callOcr(endpoint, file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${OCR_URL}/ocr/${endpoint}`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('OCR 실패')
  return res.json()
}

// ── 조회 방식 선택 카드 ──
function ModeCard({ icon, iconBg, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display:'flex', alignItems:'center', gap:14, width:'100%',
        background:'#fff', border:'1.5px solid #e5e5ea', borderRadius:16,
        padding:'18px', cursor:'pointer', fontFamily:'inherit',
        boxShadow:'0 1px 4px rgba(0,0,0,0.06)', textAlign:'left',
        WebkitTapHighlightColor:'transparent',
      }}
    >
      <div style={{
        width:48, height:48, borderRadius:13, background:iconBg,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:22, flexShrink:0,
      }}>{icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:16, fontWeight:700, color:'#1c1c1e' }}>{title}</div>
        <div style={{ fontSize:12, color:'#8e8e93', marginTop:3 }}>{desc}</div>
      </div>
      <div style={{ fontSize:18, color:'#c7c7cc', flexShrink:0 }}>›</div>
    </button>
  )
}

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

  // 'manual'(기본 — 번호 입력 + 📷) | null(조회 방식 선택 화면)
  const [mode, setMode]         = useState('manual')
  const [camera, setCamera]     = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrError, setOcrError] = useState('')

  // plateArg: 카메라 인식 직후엔 setQuery 반영을 기다리지 않고 값을 직접 넘긴다
  const handleSearch = async (plateArg) => {
    const normalized = (plateArg ?? query).trim().replace(/\s+/g, ' ')
    if (!normalized) return
    setQuery(normalized)
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

  // 카메라 촬영 → 번호판 OCR → 곧바로 조회
  const handleCapture = async (file) => {
    setCamera(false)
    setOcrError('')
    setOcrLoading(true)
    try {
      const r = await callOcr('plate', file)
      const plate = (r.plate_number || r.plateNumber || '').trim()
      if (!plate) throw new Error('번호판을 읽지 못했습니다. 다시 촬영해주세요.')
      await handleSearch(plate)
    } catch (e) {
      setOcrError(e.message || '인식에 실패했습니다')
    } finally {
      setOcrLoading(false)
    }
  }

  const clearSearch = () => {
    setQuery(''); setResult(null)
    setSearched(false); setNotFound(false); setOcrError('')
  }

  // 번호 입력 화면에서 다시 조회
  const resetSearch = () => { clearSearch(); setMode('manual') }

  // 조회 방식 선택 화면 보기
  const showModeSelect = () => { clearSearch(); setMode(null) }

  const totalSpent   = result ? result.records.reduce((s, r) => s + r.total, 0) : 0
  // API는 최신순(createdAt DESC)으로 내려준다 → 첫 번째가 가장 최근 정비
  const latestRecord = result ? result.records[0] : null
  const latestMileage = latestRecord?.mileage || '-'

  return (
    <div style={{
      maxWidth:680, margin:'0 auto',
      // 결과가 있으면 하단 고정 버튼에 가려지지 않도록 여백을 더 준다
      padding: result ? '20px 16px 110px' : '20px 16px 60px',
    }}>
      {/* ── 1단계: 조회 방식 선택 ── */}
      {mode === null && !result && !notFound ? (
        <>
          <div style={{ textAlign:'center', marginBottom:20, marginTop:8 }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#1c1c1e' }}>🔍 차량 조회</div>
            <div style={{ fontSize:13, color:'#8e8e93', marginTop:6 }}>
              정비 이력을 확인하고, 기록이 없으면 신규 등록합니다
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <ModeCard
              icon="⌨️"
              iconBg="linear-gradient(135deg,#5856d6,#007aff)"
              title="직접 조회"
              desc="차량 번호를 직접 입력합니다"
              onClick={() => setMode('manual')}
            />
            <ModeCard
              icon="📷"
              iconBg="linear-gradient(135deg,#34c759,#28a745)"
              title="카메라로 조회"
              desc="번호판을 촬영하면 자동으로 인식합니다"
              onClick={() => { setOcrError(''); setCamera(true) }}
            />
          </div>

          {ocrLoading && (
            <div style={{ marginTop:18, textAlign:'center', fontSize:13, color:'#8e8e93' }}>
              🔍 번호판 인식 중...
            </div>
          )}
          {ocrError && (
            <div style={{
              marginTop:18, background:'#fff2f2', border:'1.5px solid #ffb3b3',
              borderRadius:14, padding:'14px 16px', textAlign:'center',
            }}>
              <div style={{ fontSize:13, color:'#d70015', fontWeight:600, marginBottom:10 }}>{ocrError}</div>
              <button onClick={() => setMode('manual')} className="btn btn-gray btn-sm">
                직접 입력하기
              </button>
            </div>
          )}
        </>
      ) : (
        /* ── 2단계: 번호 입력 / 재조회 ── */
        <div style={{ background:'#fff', borderRadius:20, padding:'20px', marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
            <div style={{ fontSize:18, fontWeight:700, color:'#1c1c1e' }}>🔍 차량 정비 이력 조회</div>
            <button
              onClick={showModeSelect}
              style={{
                background:'none', border:'none', cursor:'pointer', fontFamily:'inherit',
                color:'#007aff', fontSize:13, fontWeight:600, padding:'4px 0',
                WebkitTapHighlightColor:'transparent',
              }}
            >
              조회 방식 변경
            </button>
          </div>
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
            <button onClick={() => setCamera(true)} className="btn btn-gray" style={{ fontSize:18, padding:'12px 14px' }} title="카메라로 인식">
              📷
            </button>
            <button onClick={() => handleSearch()} className="btn btn-blue" style={{ fontSize:15, padding:'12px 20px' }}>
              조회
            </button>
          </div>

          {(loading || ocrLoading) && (
            <div style={{ marginTop:10, fontSize:12, color:'#8e8e93', textAlign:'center' }}>
              {ocrLoading ? '🔍 번호판 인식 중...' : '조회 중...'}
            </div>
          )}
          {ocrError && (
            <div style={{ marginTop:10, fontSize:12, color:'#d70015', textAlign:'center', fontWeight:600 }}>
              {ocrError}
            </div>
          )}
        </div>
      )}

      {/* Not found */}
      {notFound && (
        <div style={{ background:'#fff', borderRadius:20, padding:'32px 20px', textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🚗</div>
          <div style={{ fontSize:17, fontWeight:800, color:'#1c1c1e', marginBottom:6 }}>신규 고객입니다</div>
          <div style={{ fontSize:13, color:'#8e8e93', marginBottom:22, lineHeight:1.5 }}>
            <strong style={{ fontVariantNumeric:'tabular-nums', color:'#1c1c1e' }}>{query}</strong> 차량의<br/>
            정비 기록이 없습니다. 새로 등록해주세요.
          </div>
          <button onClick={() => onNewOrder(query)} className="btn btn-blue" style={{ fontSize:15, padding:'13px 24px' }}>
            + 신규 등록하기
          </button>
          <div style={{ marginTop:14 }}>
            <button
              onClick={resetSearch}
              style={{
                background:'none', border:'none', cursor:'pointer', fontFamily:'inherit',
                color:'#8e8e93', fontSize:13, fontWeight:600, padding:'6px 10px',
                WebkitTapHighlightColor:'transparent',
              }}
            >
              번호가 잘못됐나요? 다시 조회
            </button>
          </div>
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
            {result.records.map((rec, i) => (
              <RecordCard key={rec.id} record={rec} isLatest={i === 0} />
            ))}
          </div>
        </>
      )}

      {/* ── 주 행동: 신규 정비 시작 ──
          화면 아래에 고정한다. 근거:
          · Fitts의 법칙 — 목표가 크고 가까울수록 누르기 빠르다. 폭 전체 · 높이 56px.
          · 엄지 영역 — 폰을 한 손으로 쥐면 화면 아래쪽이 가장 닿기 쉽다.
            기존의 카드 우측 상단은 반대로 가장 닿기 어려운 자리였다.
          · 이력이 길어져 스크롤해도 항상 보인다 (조회의 목적은 결국 정비 시작이다). */}
      {result && (
        <div style={{
          position:'fixed', left:0, right:0, bottom:0, zIndex:50,
          background:'rgba(255,255,255,0.92)', backdropFilter:'blur(12px)',
          borderTop:'1px solid #e5e5ea',
          padding:'10px 16px calc(10px + env(safe-area-inset-bottom))',
        }}>
          <button
            onClick={() => onNewOrder(result)}
            style={{
              display:'block', width:'100%', maxWidth:680, margin:'0 auto',
              height:56, borderRadius:16, border:'none', cursor:'pointer',
              background:'#007aff', color:'#fff',
              fontFamily:'inherit', fontSize:17, fontWeight:800, letterSpacing:'-0.2px',
              boxShadow:'0 4px 16px rgba(0,122,255,0.35)',
              WebkitTapHighlightColor:'transparent',
            }}
          >
            + {result.plateNumber} 신규 정비 시작
          </button>
        </div>
      )}

      {/* 번호판 촬영 카메라 */}
      {camera && (
        <CameraGuideModal
          type="plate"
          onCapture={handleCapture}
          onClose={() => setCamera(false)}
        />
      )}
    </div>
  )
}
