import { useState, useRef } from 'react'
import { MECHANICS, ENGINE_OIL_GASOLINE, ENGINE_OIL_DIESEL, OTHER_PRESETS, PAYMENT_TYPES } from '../data/mockData'
import { orderApi, paymentApi } from '../api/client'
import CameraGuideModal from '../components/CameraGuideModal'

const OCR_URL = import.meta.env.VITE_OCR_URL || 'http://localhost:8001'

async function callOcr(endpoint, file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${OCR_URL}/ocr/${endpoint}`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('OCR 실패')
  return res.json()
}

let nextItemId = 100

function genOrderNo() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  return `SHC-${ymd}-${String(Math.floor(Math.random()*900)+100)}`
}

// ── OCR Confirm Banner ──────────────────────────────────────────────────────
function OcrConfirmBanner({ title, fields, onConfirm, onEdit }) {
  return (
    <div style={{ background:'#fff8e6', border:'1.5px solid #ff9500', borderRadius:14, padding:'14px 16px', marginTop:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
        <span>🔍</span>
        <span style={{ fontSize:12, fontWeight:700, color:'#cc7700' }}>OCR 인식 결과 — {title}</span>
      </div>
      <div style={{ background:'#fff', borderRadius:10, padding:'10px 14px', marginBottom:10, border:'1.5px solid #ffd060' }}>
        {fields.map(f => (
          <div key={f.label} style={{ display:'flex', gap:10, padding:'3px 0', alignItems:'baseline' }}>
            <span style={{ fontSize:11, color:'#aeaeb2', minWidth:56 }}>{f.label}</span>
            <span style={{ fontSize:15, fontWeight:700, color:'#1c1c1e',
              fontFamily: f.mono ? 'ui-monospace,monospace' : 'inherit',
              letterSpacing: f.mono ? '0.05em' : 'normal' }}>
              {f.value}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <span style={{ fontSize:11, color:'#cc7700', flex:1 }}>위 정보가 맞는지 확인해주세요</span>
        <button onClick={onEdit} className="btn btn-gray btn-xs">다시 촬영</button>
        <button onClick={onConfirm} className="btn btn-orange btn-xs">확인 ✓</button>
      </div>
    </div>
  )
}

// ── Camera Button ───────────────────────────────────────────────────────────
function CameraButton({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:5,
      background:'#f2f2f7', border:'1.5px dashed #c7c7cc', borderRadius:10,
      padding:'7px 12px', cursor:'pointer', fontFamily:'inherit',
      color:'#3c3c43', fontSize:12, fontWeight:600, flexShrink:0,
      transition:'all 0.15s'
    }}>
      <span style={{ fontSize:14 }}>📷</span>{label}
    </button>
  )
}

// ── Engine Oil Picker (엔진오일 전용 UI) ─────────────────────────────────────
// 연료 타입별 가장 많이 사용하는 리터
const POPULAR_LITER = { gasoline: 4, diesel: 7 }

function OilPicker({ onSelect, onClose }) {
  const [fuelType, setFuelType] = useState('gasoline') // 'gasoline' | 'diesel'
  const [selectedBrand, setSelectedBrand] = useState(null)
  const brands = fuelType === 'gasoline' ? ENGINE_OIL_GASOLINE : ENGINE_OIL_DIESEL
  const popularL = POPULAR_LITER[fuelType]

  const handleLiterClick = (brand, liter) => {
    const fuelLabel = fuelType === 'gasoline' ? '가솔린' : '디젤'
    onSelect({
      name: `${brand.brand} ${brand.grade} ${liter.l}L (${fuelLabel})`,
      price: liter.price,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight:'92svh' }}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ padding:'14px 20px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:'#1c1c1e' }}>🛢️ 엔진오일 선택</div>
            <div style={{ fontSize:11, color:'#8e8e93', marginTop:2 }}>오일필터 · 에어클리너 · 공임 포함 금액</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Fuel type toggle */}
        <div style={{ padding:'12px 20px', display:'flex', gap:8 }}>
          {[
            { key:'gasoline', label:'가솔린 / LPG' },
            { key:'diesel',   label:'디젤' },
          ].map(ft => (
            <button
              key={ft.key}
              onClick={() => { setFuelType(ft.key); setSelectedBrand(null) }}
              style={{
                flex:1, padding:'10px', borderRadius:12, border:'none', cursor:'pointer',
                fontFamily:'inherit', fontSize:14, fontWeight:700,
                background: fuelType === ft.key ? '#1c1c1e' : '#f2f2f7',
                color: fuelType === ft.key ? '#fff' : '#8e8e93',
                transition:'all 0.15s'
              }}
            >{ft.label}</button>
          ))}
        </div>

        <div style={{ overflowY:'auto', padding:'0 20px 32px', display:'flex', flexDirection:'column', gap:10 }}>
          {brands.map(brand => {
            const isOpen = selectedBrand === brand.abbr
            return (
              <div key={brand.abbr} style={{
                borderRadius:16, border:`1.5px solid ${isOpen ? brand.color : '#e5e5ea'}`,
                background: isOpen ? '#fafafa' : '#fff',
                overflow:'hidden', transition:'all 0.15s'
              }}>
                {/* Brand header row */}
                <button
                  onClick={() => setSelectedBrand(isOpen ? null : brand.abbr)}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', gap:12,
                    padding:'14px 16px', border:'none', background:'transparent',
                    cursor:'pointer', fontFamily:'inherit', textAlign:'left'
                  }}
                >
                  {/* Abbr badge — 밝은 배경(골드·회색)은 어두운 텍스트 */}
                  {(() => {
                    const lightBg = ['#b8860b','#6b7280'].includes(brand.color)
                    return (
                      <div style={{
                        minWidth:52, height:52, borderRadius:12,
                        background: brand.color,
                        display:'flex', flexDirection:'column',
                        alignItems:'center', justifyContent:'center', flexShrink:0,
                        boxShadow:`0 2px 8px ${brand.color}55`
                      }}>
                        <span style={{ fontSize:13, fontWeight:900, color: lightBg ? '#fff' : '#fff', letterSpacing:'-0.3px', lineHeight:1, textAlign:'center', padding:'0 4px' }}>
                          {brand.abbr}
                        </span>
                      </div>
                    )
                  })()}

                  {/* Brand info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#1c1c1e' }}>{brand.brand}</div>
                    <div style={{ fontSize:12, color: brand.color, fontWeight:600, marginTop:1 }}>{brand.grade}</div>
                    <div style={{ fontSize:11, color:'#aeaeb2', marginTop:2, lineHeight:1.4 }}>{brand.desc}</div>
                  </div>

                  {/* Price range preview */}
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:11, color:'#aeaeb2' }}>
                      {(brand.liters[0].price/10000).toFixed(0)}~{(brand.liters[brand.liters.length-1].price/10000).toFixed(0)}만
                    </div>
                    <div style={{ fontSize:18, color: isOpen ? brand.color : '#c7c7cc', transition:'transform 0.2s', display:'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                      ⌄
                    </div>
                  </div>
                </button>

                {/* Liter selection grid */}
                {isOpen && (
                  <div style={{ padding:'0 16px 16px' }}>
                    <div style={{ borderTop:`1px dashed ${brand.color}30`, paddingTop:12, display:'flex', flexWrap:'wrap', gap:8 }}>
                      {brand.liters.map(liter => {
                        const isPopular = liter.l === popularL
                        return (
                        <button
                          key={liter.l}
                          onClick={() => handleLiterClick(brand, liter)}
                          style={{
                            display:'flex', flexDirection:'column', alignItems:'center',
                            padding: isPopular ? '16px 16px' : '10px 12px',
                            borderRadius: isPopular ? 16 : 12,
                            border:`2px solid ${brand.color}`,
                            background: isPopular ? brand.color : '#fff',
                            cursor:'pointer', fontFamily:'inherit',
                            transition:'all 0.12s',
                            minWidth: isPopular ? 84 : 64,
                            flex: isPopular ? '2 1 84px' : '1 1 64px',
                            position:'relative',
                          }}
                        >
                          {isPopular && (
                            <span style={{
                              position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)',
                              background:'#ff9500', color:'#fff', fontSize:9, fontWeight:800,
                              padding:'2px 7px', borderRadius:10, whiteSpace:'nowrap',
                              letterSpacing:'0.04em'
                            }}>최다 사용</span>
                          )}
                          <span style={{ fontSize: isPopular ? 28 : 20, fontWeight:900, letterSpacing:'-0.5px', lineHeight:1, color: isPopular ? '#fff' : '#1c1c1e' }}>{liter.l}</span>
                          <span style={{ fontSize: isPopular ? 11 : 10, fontWeight:700, color: isPopular ? 'rgba(255,255,255,0.8)' : '#aeaeb2', marginTop:2 }}>리터</span>
                          <span style={{ fontSize: isPopular ? 15 : 12, fontWeight:800, marginTop:6, color: isPopular ? 'rgba(255,255,255,0.95)' : brand.color, fontVariantNumeric:'tabular-nums' }}>
                            {(liter.price/10000).toFixed(0)}만원
                          </span>
                        </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Other Preset Picker ─────────────────────────────────────────────────────
function OtherPresetPicker({ onSelect, onClose }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const cat = OTHER_PRESETS[activeIdx]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ padding:'14px 20px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:18, fontWeight:700, color:'#1c1c1e' }}>항목 선택</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Category tabs */}
        <div style={{ display:'flex', gap:6, padding:'12px 20px', overflowX:'auto', borderBottom:'0.5px solid #e5e5ea' }}>
          {OTHER_PRESETS.map((c, i) => (
            <button key={c.category} onClick={() => setActiveIdx(i)} style={{
              padding:'7px 14px', borderRadius:20, border:'none', cursor:'pointer',
              fontFamily:'inherit', fontSize:12, fontWeight:600, whiteSpace:'nowrap',
              background: activeIdx === i ? '#1c1c1e' : '#f2f2f7',
              color: activeIdx === i ? '#fff' : '#3c3c43', transition:'all 0.15s',
              display:'flex', alignItems:'center', gap:4
            }}>
              {c.icon} {c.category}
            </button>
          ))}
        </div>

        <div style={{ padding:'12px 20px 32px', display:'flex', flexDirection:'column', gap:6 }}>
          {cat.items.map(item => (
            <button key={item.id} onClick={() => { onSelect(item); onClose() }} style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'14px 16px', borderRadius:14, border:'1.5px solid #e5e5ea',
              background:'#fafafa', cursor:'pointer', fontFamily:'inherit',
              transition:'all 0.12s', textAlign:'left'
            }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, color:'#1c1c1e', fontWeight:600 }}>{item.name}</div>
                {item.note && <div style={{ fontSize:11, color:'#aeaeb2', marginTop:2 }}>{item.note}</div>}
              </div>
              <span style={{ fontSize:15, color:'#007aff', fontWeight:700, fontVariantNumeric:'tabular-nums', flexShrink:0, marginLeft:12 }}>
                {item.price.toLocaleString()}원
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Repair Item Row ─────────────────────────────────────────────────────────
function RepairItemRow({ item, index, onChange, onRemove }) {
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'18px 1fr 110px 24px',
      gap:8, alignItems:'center', padding:'9px 0',
      borderBottom:'1px dashed #e5e5ea'
    }}>
      <span style={{ fontSize:12, color:'#aeaeb2', fontWeight:600, textAlign:'center' }}>{index + 1}</span>
      <input
        type="text" value={item.name}
        onChange={e => onChange(item.id, 'name', e.target.value)}
        placeholder="정비 내역"
        style={{ border:'none', background:'transparent', outline:'none', fontSize:14, color:'#1c1c1e', fontFamily:'inherit', width:'100%', padding:'3px 0', borderBottom:'1px solid transparent' }}
        onFocus={e => e.target.style.borderBottomColor = '#007aff'}
        onBlur={e => e.target.style.borderBottomColor = 'transparent'}
      />
      <input
        type="number" value={item.price || ''}
        onChange={e => onChange(item.id, 'price', Number(e.target.value))}
        placeholder="0"
        style={{ border:'none', background:'transparent', outline:'none', fontSize:14, fontWeight:600, color:'#1c1c1e', fontFamily:'inherit', textAlign:'right', width:'100%', padding:'3px 0', fontVariantNumeric:'tabular-nums', borderBottom:'1px solid transparent' }}
        onFocus={e => e.target.style.borderBottomColor = '#007aff'}
        onBlur={e => e.target.style.borderBottomColor = 'transparent'}
      />
      <button onClick={() => onRemove(item.id)} style={{
        width:22, height:22, borderRadius:'50%', background:'#ff3b30',
        border:'none', color:'#fff', fontSize:14, cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center', padding:0, flexShrink:0
      }}>−</button>
    </div>
  )
}

// ── Main Form ───────────────────────────────────────────────────────────────
export default function RepairOrderForm({ onBack, currentUser, existingOrder }) {
  const orderNo = useRef(genOrderNo())
  const today = new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'long' })

  const [plateNumber, setPlateNumber] = useState(existingOrder?.plateNumber || '')
  const [model, setModel]             = useState(existingOrder?.model || '')
  const [year, setYear]               = useState(existingOrder?.year || '')
  const [vin, setVin]                 = useState(existingOrder?.vin || '')
  const [mileage, setMileage]         = useState(existingOrder?.mileage || '')
  const [mechanicId, setMechanicId]   = useState(existingOrder?.mechanicId || currentUser.id)

  const [plateOcr, setPlateOcr] = useState(null)
  const [vinOcr, setVinOcr]     = useState(null)
  const [odomOcr, setOdomOcr]   = useState(null)

  const [items, setItems]           = useState(existingOrder?.items.map(it => ({ ...it, id: nextItemId++ })) || [])
  const [paymentType, setPaymentType] = useState(existingOrder?.paymentType || null)

  const [modal, setModal]           = useState(null)   // null | 'oil' | 'other'
  const [saving, setSaving]         = useState(false)
  const [ocrLoading, setOcrLoading] = useState('')     // 'plate' | 'vin' | 'odometer' | ''
  const [cameraType, setCameraType] = useState(null)   // null | 'vin' | 'plate' | 'odometer'
  const plateInputRef = useRef(null)
  const vinInputRef   = useRef(null)
  const odomInputRef  = useRef(null)

  const total = items.reduce((s, it) => s + (Number(it.price) || 0), 0)
  const vinFilled = !!(vin || model || year)

  // ── OCR: 이미지 blob/file → FastAPI 호출 ──
  const processOcrFile = async (type, file) => {
    setOcrLoading(type)
    try {
      if (type === 'plate') {
        const r = await callOcr('plate', file)
        setPlateOcr(r)
      } else if (type === 'vin') {
        const r = await callOcr('vin', file)
        setVinOcr(r)
      } else if (type === 'odometer') {
        const r = await callOcr('odometer', file)
        setOdomOcr({ mileage: r.mileage.toLocaleString() })
      }
    } catch {
      // OCR 서비스 없을 때 시뮬레이션 폴백
      if (type === 'plate')    setPlateOcr({ plate_number: '12가 3456', confidence: 0.9 })
      if (type === 'vin')      setVinOcr({ vin: 'KMHD241ABNU123456', model: '현대 아반떼 CN7', year: 2021, confidence: 0.9 })
      if (type === 'odometer') setOdomOcr({ mileage: '42,180' })
    } finally {
      setOcrLoading('')
    }
  }

  // 번호판: 단순 파일 선택 (어느 방향이든 잘 인식되므로 가이드 불필요)
  const triggerPlateOcr = () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) processOcrFile('plate', file)
    }
    input.click()
  }

  // VIN / 계기판: 가이드 프레임 카메라 모달 열기
  const triggerOcr = (type) => {
    if (type === 'plate') {
      triggerPlateOcr()
    } else {
      setCameraType(type)  // 가이드 모달 오픈
    }
  }

  // 카메라 모달에서 캡처 완료
  const handleCameraCapture = (blobOrFile) => {
    setCameraType(null)
    const file = blobOrFile instanceof Blob && !(blobOrFile instanceof File)
      ? new File([blobOrFile], `capture_${cameraType}.jpg`, { type: 'image/jpeg' })
      : blobOrFile
    processOcrFile(cameraType, file)
  }

  const confirmPlateOcr = () => { setPlateNumber(plateOcr.plate_number || plateOcr.plateNumber || ''); setPlateOcr(null) }
  const confirmVinOcr   = () => {
    if (vinOcr.vin)   setVin(vinOcr.vin)
    if (vinOcr.model) setModel(vinOcr.model)
    if (vinOcr.year)  setYear(String(vinOcr.year))
    setVinOcr(null)
  }
  const confirmOdomOcr  = () => { setMileage(String(odomOcr.mileage)); setOdomOcr(null) }

  const addEmptyItem = () => setItems(prev => [...prev, { id: nextItemId++, name: '', price: 0 }])
  const addPreset    = (preset) => setItems(prev => [...prev, { id: nextItemId++, name: preset.name, price: preset.price }])
  const updateItem   = (id, field, value) => setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it))
  const removeItem   = (id) => setItems(prev => prev.filter(it => it.id !== id))

  // ── 저장 ──
  const handleSubmit = async () => {
    if (!plateNumber.trim()) { alert('차량 번호를 입력해주세요.'); return }
    if (items.length === 0)  { alert('정비 항목을 1개 이상 추가해주세요.'); return }
    if (!paymentType)        { alert('결제 방법을 선택해주세요.'); return }

    setSaving(true)
    try {
      // 1. 주문 생성
      const order = await orderApi.create({
        plateNumber: plateNumber.trim(),
        model: model || null,
        year:  year  ? Number(year)  : null,
        vin:   vin   || null,
        mileage: mileage ? Number(mileage.replace(/,/g, '')) : null,
        items: items.map((it, i) => ({
          name:       it.name,
          itemType:   it.itemType || 'CUSTOM',
          unitPrice:  Number(it.price) || 0,
          quantity:   1,
          oilBrand:   it.oilBrand  || null,
          oilLiters:  it.oilLiters || null,
          sortOrder:  i,
        })),
      })

      // 2. 결제 등록
      await paymentApi.create({
        orderId:     order.id,
        paymentType: paymentType,
        amount:      total,
      })

      const pt = PAYMENT_TYPES.find(p => p.key === paymentType)
      const isCash = paymentType === 'CASH'
      alert(isCash
        ? `✅ 정비 내역서 저장 완료\n현금 결제는 사장님 승인 후 확정됩니다.\n합계: ${total.toLocaleString()}원`
        : `✅ 정비 내역서 저장 완료\n차량: ${plateNumber}\n결제: ${pt?.label} ${total.toLocaleString()}원`)

      if (onBack) onBack()
    } catch (e) {
      alert(`저장 실패: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div style={{ maxWidth:680, margin:'0 auto', padding:'20px 16px 60px' }}>
        <div className="paper-a4">

          {/* ── Document Header ── */}
          <div style={{ padding:'24px 28px 20px', borderBottom:'2px solid #1c1c1e' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:22, fontWeight:900, color:'#1c1c1e', letterSpacing:'-0.5px' }}>시화카 정비소</div>
                <div style={{ fontSize:11, color:'#8e8e93', marginTop:2 }}>정비 내역서 (Work Order)</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:11, color:'#8e8e93', marginBottom:2 }}>No. {orderNo.current}</div>
                <div style={{ fontSize:13, color:'#3c3c43', fontWeight:500 }}>{today}</div>
              </div>
            </div>
          </div>

          {/* ── Vehicle Info ── */}
          <div className="form-section">
            <div style={{ fontSize:11, fontWeight:800, color:'#8e8e93', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:16 }}>차량 정보</div>

            {/* 번호판 */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <div className="form-label">차량 등록 번호 *</div>
                {!plateNumber && <CameraButton label={ocrLoading==='plate' ? '인식 중...' : '번호판 촬영'} onClick={() => triggerOcr('plate')} />}
              </div>
              <input type="text" value={plateNumber} onChange={e => setPlateNumber(e.target.value)} placeholder="12가 3456" className="field-input" style={{ fontSize:26, fontWeight:900, letterSpacing:'0.06em' }} />
              {plateOcr && (
                <OcrConfirmBanner title="번호판" fields={[{ label:'차량 번호', value:plateOcr.plateNumber, mono:true }]} onConfirm={confirmPlateOcr} onEdit={() => setPlateOcr(null)} />
              )}
            </div>

            {/* 차대번호 스티커 */}
            <div style={{ marginBottom:14 }}>
              <div className="form-label" style={{ marginBottom:8 }}>차대번호 스티커 (차종 · 연식 · VIN 자동 인식)</div>
              {!vinFilled && !vinOcr && (
                <button onClick={() => triggerOcr('vin')} style={{
                  width:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  padding:'22px 0', gap:8, background:'#fafafa', border:'2px dashed #c7c7cc',
                  borderRadius:14, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s'
                }}
                  onMouseOver={e => { e.currentTarget.style.borderColor='#007aff'; e.currentTarget.style.background='#f0f5ff' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor='#c7c7cc'; e.currentTarget.style.background='#fafafa' }}
                >
                  <div style={{ fontSize:30 }}>📷</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#3c3c43' }}>차대번호 스티커 촬영</div>
                  <div style={{ fontSize:11, color:'#8e8e93', textAlign:'center', lineHeight:1.6 }}>운전석 도어 옆 스티커를 촬영하면<br />차종 · 연식 · VIN이 자동 입력됩니다</div>
                </button>
              )}
              {vinOcr && (
                <OcrConfirmBanner title="차대번호 스티커" fields={[{ label:'VIN', value:vinOcr.vin, mono:true }, { label:'차종', value:vinOcr.model }, { label:'연식', value:vinOcr.year+'년식' }]} onConfirm={confirmVinOcr} onEdit={() => setVinOcr(null)} />
              )}
              {vinFilled && !vinOcr && (
                <div style={{ background:'#f0fdf4', border:'1.5px solid #34c759', borderRadius:14, padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#1a7a35' }}>✓ 차대번호 스티커 인식 완료</span>
                    <CameraButton label="재촬영" onClick={() => triggerOcr('vin')} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 16px' }}>
                    <div>
                      <div className="form-label">차종</div>
                      <input type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="현대 아반떼" className="field-input" />
                    </div>
                    <div>
                      <div className="form-label">연식</div>
                      <input type="text" value={year} onChange={e => setYear(e.target.value)} placeholder="2021" className="field-input" />
                    </div>
                    <div style={{ gridColumn:'1 / -1' }}>
                      <div className="form-label">차대번호 (VIN)</div>
                      <input type="text" value={vin} onChange={e => setVin(e.target.value)} placeholder="KMHD241ABNU123456" className="field-input" style={{ fontFamily:'ui-monospace,monospace', fontSize:13, letterSpacing:'0.04em' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 주행거리 */}
            <div style={{ display:'flex', gap:10, alignItems:'flex-end', marginBottom:14 }}>
              <div style={{ flex:1 }}>
                <div className="form-label" style={{ marginBottom:6 }}>입고 시 주행거리 (km)</div>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <input type="text" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="42,180" className="field-input" style={{ flex:1, fontSize:18, fontWeight:700, fontVariantNumeric:'tabular-nums' }} />
                  <span style={{ fontSize:13, color:'#8e8e93', paddingBottom:4, flexShrink:0 }}>km</span>
                </div>
                {odomOcr && (
                  <OcrConfirmBanner title="계기판" fields={[{ label:'주행거리', value:odomOcr.mileage+' km' }]} onConfirm={confirmOdomOcr} onEdit={() => setOdomOcr(null)} />
                )}
              </div>
              <div style={{ paddingBottom:4 }}>
                <CameraButton label={ocrLoading==='odometer' ? '인식 중...' : '계기판 촬영'} onClick={() => triggerOcr('odometer')} />
              </div>
            </div>

            {/* 담당 정비사 */}
            <div>
              <div className="form-label" style={{ marginBottom:8 }}>담당 정비사</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {MECHANICS.map(m => (
                  <button key={m.id} onClick={() => setMechanicId(m.id)} style={{
                    padding:'8px 14px', borderRadius:10, border:'none', cursor:'pointer',
                    fontFamily:'inherit', fontSize:13, fontWeight:600,
                    background: mechanicId === m.id ? '#1c1c1e' : '#f2f2f7',
                    color: mechanicId === m.id ? '#fff' : '#3c3c43',
                    display:'flex', alignItems:'center', gap:5, transition:'all 0.15s'
                  }}>
                    <span className={m.grade === 'A' ? 'grade-a' : 'grade-b'}>{m.grade}</span>
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Repair Items ── */}
          <div className="form-section">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#8e8e93', letterSpacing:'0.08em', textTransform:'uppercase' }}>정비 내역</div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => setModal('oil')}   className="btn btn-blue btn-xs">🛢️ 엔진오일</button>
                <button onClick={() => setModal('other')} className="btn btn-gray btn-xs">🔧 항목 선택</button>
                <button onClick={addEmptyItem}            className="btn btn-gray btn-xs">+ 직접 입력</button>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'18px 1fr 110px 24px', gap:8, padding:'4px 0 6px', borderBottom:'2px solid #1c1c1e' }}>
              <span />
              <span style={{ fontSize:10, fontWeight:700, color:'#8e8e93', letterSpacing:'0.05em', textTransform:'uppercase' }}>항목</span>
              <span style={{ fontSize:10, fontWeight:700, color:'#8e8e93', letterSpacing:'0.05em', textTransform:'uppercase', textAlign:'right' }}>금액</span>
              <span />
            </div>

            {items.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px 0', color:'#c7c7cc', fontSize:13 }}>
                위 버튼으로 정비 내역을 추가하세요
              </div>
            ) : (
              items.map((item, i) => (
                <RepairItemRow key={item.id} item={item} index={i} onChange={updateItem} onRemove={removeItem} />
              ))
            )}
          </div>

          {/* ── Total ── */}
          <div style={{ background:'#f9f9fb', borderTop:'2px solid #1c1c1e', padding:'16px 24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#3c3c43', letterSpacing:'0.03em' }}>합 계</span>
              <span style={{ fontSize:32, fontWeight:900, color:'#1c1c1e', letterSpacing:'-1px', fontVariantNumeric:'tabular-nums' }}>
                {total.toLocaleString()}<span style={{ fontSize:15, fontWeight:500, marginLeft:3 }}>원</span>
              </span>
            </div>
          </div>

          {/* ── Payment ── */}
          <div className="form-section">
            <div style={{ fontSize:11, fontWeight:800, color:'#8e8e93', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>결제 방법</div>
            <div style={{ display:'flex', gap:8 }}>
              {PAYMENT_TYPES.map(pt => (
                <button key={pt.key} onClick={() => setPaymentType(paymentType === pt.key ? null : pt.key)} className={`pay-btn ${paymentType === pt.key ? pt.selectedClass : ''}`}>
                  <div style={{ fontSize:22, marginBottom:4 }}>{pt.icon}</div>
                  <div style={{ fontSize:12 }}>{pt.label}</div>
                </button>
              ))}
            </div>
            {paymentType === 'CREDIT' && (
              <div style={{ marginTop:10, background:'#fff8e6', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#cc7700' }}>
                ⚠️ 미수 처리됩니다. 사장님 확인 후 별도 정산해주세요.
              </div>
            )}
            {paymentType === 'CASH' && (
              <div style={{ marginTop:10, background:'#fff8e6', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#cc7700' }}>
                💵 현금 수령 확인 후 사장님 승인이 필요합니다.
              </div>
            )}
          </div>

          {/* ── Submit ── */}
          <div style={{ padding:'16px 24px 28px' }}>
            <button onClick={handleSubmit} className="btn btn-blue" style={{ width:'100%', fontSize:16, padding:'15px', opacity: saving ? 0.6 : 1 }} disabled={saving || !plateNumber.trim() || items.length === 0 || !paymentType}>
              {saving ? '저장 중...' : '정비 내역서 저장'}
            </button>
            {(!plateNumber.trim() || items.length === 0 || !paymentType) && (
              <div style={{ textAlign:'center', fontSize:12, color:'#aeaeb2', marginTop:8 }}>
                차량 번호 · 정비 항목 · 결제 방법을 모두 입력해주세요
              </div>
            )}
          </div>

        </div>
      </div>

      {modal === 'oil'   && <OilPicker onSelect={addPreset} onClose={() => setModal(null)} />}
      {modal === 'other' && <OtherPresetPicker onSelect={addPreset} onClose={() => setModal(null)} />}

      {/* VIN / 계기판 가이드 카메라 */}
      {cameraType && (
        <CameraGuideModal
          type={cameraType}
          onCapture={handleCameraCapture}
          onClose={() => setCameraType(null)}
        />
      )}
    </>
  )
}
