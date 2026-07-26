import { useState, useRef, useEffect } from 'react'
import { ENGINE_OIL_GASOLINE, ENGINE_OIL_DIESEL, OTHER_PRESETS, DEFAULT_FAVORITE_IDS, PAYMENT_TYPES } from '../data/mockData'
import { orderApi, paymentApi, mechanicApi } from '../api/client'
import CameraGuideModal from '../components/CameraGuideModal'

const OCR_URL = import.meta.env.VITE_OCR_URL ?? ''

async function callOcr(endpoint, file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${OCR_URL}/ocr/${endpoint}`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('OCR 실패')
  return res.json()
}

// 차종·연식 → 권장 엔진오일 사양. 어디까지나 참고값이고 선택은 정비사가 한다.
async function fetchOilSpec({ model, year, vin }) {
  const res = await fetch(`${OCR_URL}/spec/oil`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model || null, year: year ? Number(year) : null, vin: vin || null }),
  })
  if (!res.ok) throw new Error('사양 조회 실패')
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
function CameraButton({ label = '카메라', onClick }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:5,
      background:'#f2f2f7', border:'1.5px dashed #c7c7cc', borderRadius:10,
      padding:'7px 12px', cursor:'pointer', fontFamily:'inherit',
      color:'#3c3c43', fontSize:12, fontWeight:600, flexShrink:0,
      transition:'all 0.15s', WebkitTapHighlightColor:'transparent',
    }}>
      <span style={{ fontSize:14 }}>📷</span>{label}
    </button>
  )
}

// ── Gallery Button (파일 선택) ───────────────────────────────────────────────
function GalleryButton({ type, onFile }) {
  return (
    <label style={{
      display:'flex', alignItems:'center', gap:5,
      background:'#f2f2f7', border:'1.5px dashed #c7c7cc', borderRadius:10,
      padding:'7px 12px', cursor:'pointer', fontFamily:'inherit',
      color:'#3c3c43', fontSize:12, fontWeight:600, flexShrink:0,
      transition:'all 0.15s', WebkitTapHighlightColor:'transparent',
    }}>
      <span style={{ fontSize:14 }}>🖼</span>갤러리
      <input
        type="file" accept="image/*"
        style={{ display:'none' }}
        onChange={e => { const f = e.target.files[0]; if (f) onFile(f) }}
      />
    </label>
  )
}

// ── Engine Oil Picker (엔진오일 전용 UI) ─────────────────────────────────────
// 연료 타입별 가장 많이 사용하는 리터
const POPULAR_LITER = { gasoline: 4, diesel: 7 }

function OilPicker({ onSelect, onClose, oilSpec }) {
  // 추천이 있으면 그 연료 타입으로 열어준다 (탭 전환 한 번을 줄인다)
  const [fuelType, setFuelType] = useState(oilSpec?.fuel_type || 'gasoline') // 'gasoline' | 'diesel'
  const [selectedBrand, setSelectedBrand] = useState(null)
  const brands = fuelType === 'gasoline' ? ENGINE_OIL_GASOLINE : ENGINE_OIL_DIESEL

  // 추천 리터가 이 연료 타입에 해당할 때만 '권장'으로 강조.
  // 없으면 기존의 '최다 사용'으로 되돌아간다.
  const recommendL = (oilSpec?.fuel_type === fuelType && oilSpec?.liters)
    ? Math.round(oilSpec.liters) : null
  const popularL = recommendL ?? POPULAR_LITER[fuelType]
  const highlightLabel = recommendL ? '이 차 주입량' : '최다 사용'

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

        {/* 차량 기반 추천 — 정보만 제공하고 선택은 아래에서 직접 누른다 */}
        {recommendL && (
          <div style={{
            margin:'12px 20px 0', background:'#eafaf0', border:'2px solid #34c759',
            borderRadius:14, padding:'13px 16px',
          }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#1a7a35' }}>🛢️ 이 차에는</span>
              <span style={{ fontSize:26, fontWeight:900, color:'#1a7a35', letterSpacing:'-0.5px', lineHeight:1 }}>
                {oilSpec.liters}L
              </span>
              <span style={{ fontSize:13, fontWeight:700, color:'#1a7a35' }}>
                들어갑니다{oilSpec.viscosity && ` · ${oilSpec.viscosity}`}
              </span>
            </div>
            <div style={{ fontSize:11, color:'#5a8a6a', marginTop:5, lineHeight:1.5 }}>
              아래 초록색 칸이 그 용량입니다. 다른 용량도 그대로 누를 수 있습니다.
            </div>
          </div>
        )}

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
                        // 이 차에 실제로 들어가는 양일 때는 브랜드색 대신 초록으로 칠한다.
                        // 색상(hue)은 전주의적으로 인지되므로, 주변을 무채색으로 죽이고
                        // 하나만 유채색으로 두면 "찾는" 게 아니라 "보인다".
                        const isFit = isPopular && !!recommendL
                        const fitColor = '#34c759'
                        const accent = isFit ? fitColor : brand.color
                        // 추천이 있으면 나머지 타일의 테두리는 회색으로 낮춘다 (신호 대 잡음비)
                        const restBorder = recommendL ? '#e5e5ea' : brand.color

                        return (
                        <button
                          key={liter.l}
                          onClick={() => handleLiterClick(brand, liter)}
                          style={{
                            display:'flex', flexDirection:'column', alignItems:'center',
                            padding: isPopular ? '18px 16px' : '10px 12px',
                            borderRadius: isPopular ? 16 : 12,
                            border: isPopular ? `2.5px solid ${accent}` : `2px solid ${restBorder}`,
                            background: isPopular ? accent : '#fff',
                            boxShadow: isFit ? `0 0 0 4px ${fitColor}28, 0 4px 14px ${fitColor}55` : 'none',
                            cursor:'pointer', fontFamily:'inherit',
                            transition:'all 0.12s',
                            minWidth: isPopular ? 96 : 64,
                            flex: isPopular ? '2 1 96px' : '1 1 64px',
                            position:'relative',
                          }}
                        >
                          {isPopular && (
                            <span style={{
                              position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)',
                              background: isFit ? fitColor : '#ff9500', color:'#fff',
                              fontSize:10, fontWeight:800,
                              padding:'3px 9px', borderRadius:10, whiteSpace:'nowrap',
                              letterSpacing:'0.02em',
                              boxShadow: isFit ? `0 2px 8px ${fitColor}66` : 'none',
                            }}>{highlightLabel}</span>
                          )}
                          <span style={{ fontSize: isPopular ? 32 : 20, fontWeight:900, letterSpacing:'-0.5px', lineHeight:1, color: isPopular ? '#fff' : '#1c1c1e' }}>{liter.l}</span>
                          <span style={{ fontSize: isPopular ? 11 : 10, fontWeight:700, color: isPopular ? 'rgba(255,255,255,0.85)' : '#aeaeb2', marginTop:3 }}>리터</span>
                          <span style={{ fontSize: isPopular ? 15 : 12, fontWeight:800, marginTop:6, color: isPopular ? 'rgba(255,255,255,0.95)' : (recommendL ? '#8e8e93' : brand.color), fontVariantNumeric:'tabular-nums' }}>
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

// ── Other Preset Picker — 즐겨찾기 + 검색 + 계통별 아코디언 ────────────────
//
// 분류를 아무리 잘 해도 카테고리를 여는 순간 항상 2단계다.
// 그런데 실제 작업의 대부분은 소수 항목(오일·패드·얼라인먼트·에어컨)에서 나온다.
// 그 항목들은 0단계여야 한다 → 맨 위 즐겨찾기 그리드.
//
// 즐겨찾기는 "자동 최근 사용"이 아니라 수동 고정이다.
// 자동이면 자리가 계속 움직여서 손이 위치를 외우지 못하고 매번 읽어야 한다.
// 자리가 고정되어야 며칠 뒤엔 보지 않고 누르게 된다.
const FAV_KEY = 'shc_fav_items'

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* 깨진 값이면 기본값으로 되돌린다 */ }
  return DEFAULT_FAVORITE_IDS
}

const ALL_ITEMS = OTHER_PRESETS.flatMap(c => c.items.map(it => ({ ...it, category: c.category, icon: c.icon })))

// 수량 항목(에어컨 가스)을 실제 정비 내역 한 줄로 바꾼다
function materialize(item, qty) {
  if (!item.per) return { name: item.name, price: item.price }
  return { name: `${item.name} ${qty}${item.unit}`, price: item.price * (qty / item.per) }
}

function OtherPresetPicker({ onSelect, onClose }) {
  const [openIdx, setOpenIdx] = useState(0)
  const [query, setQuery] = useState('')
  const [favIds, setFavIds] = useState(loadFavorites)
  // 수량 항목별 현재 수량 { [itemId]: qty }
  const [qtys, setQtys] = useState(() =>
    Object.fromEntries(ALL_ITEMS.filter(i => i.per).map(i => [i.id, i.defaultQty])))

  const toggleFav = (id) => {
    setFavIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem(FAV_KEY, JSON.stringify(next))
      return next
    })
  }

  const pick = (item) => { onSelect(materialize(item, qtys[item.id])); onClose() }

  const favItems = favIds.map(id => ALL_ITEMS.find(i => i.id === id)).filter(Boolean)

  // 검색 — 두 글자만 쳐도 카테고리를 건너뛴다. 아코디언은 처음 익힐 때만 쓰인다.
  const q = query.trim().toLowerCase()
  const hits = q ? ALL_ITEMS.filter(i =>
    i.name.toLowerCase().includes(q) || (i.note || '').toLowerCase().includes(q)) : []

  // ── 항목 한 줄 (별 토글 + 수량 스테퍼 포함) ──
  // 한 줄 전체가 하나의 누름 영역이다.
  // 이전에는 이름 부분만 button이라 실제 누를 수 있는 곳이 세로 몇 px에 불과했다.
  // 행 높이 60px — Apple HIG 최소 44pt를 넉넉히 넘긴다.
  // 별 · 스테퍼는 행 안에 있지만 다른 동작이므로 stopPropagation으로 분리한다.
  const ItemRow = ({ item, showCategory, first }) => {
    const isFav = favIds.includes(item.id)
    const qty = qtys[item.id]
    const price = item.per ? item.price * (qty / item.per) : item.price
    return (
      <div
        role="button" tabIndex={0}
        onClick={() => pick(item)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') pick(item) }}
        style={{
          display:'flex', alignItems:'center', gap:10,
          minHeight:60, padding:'10px 14px 10px 10px',
          borderTop: first ? 'none' : '1px solid #f2f2f7', background:'#fff',
          cursor:'pointer', WebkitTapHighlightColor:'transparent',
          transition:'background 0.1s',
        }}
        onMouseOver={e => e.currentTarget.style.background = '#f5f8ff'}
        onMouseOut={e => e.currentTarget.style.background = '#fff'}
      >
        {/* 별 — 자체도 44px 정사각형이라 잘못 눌릴 일이 없다 */}
        <button
          onClick={e => { e.stopPropagation(); toggleFav(item.id) }}
          title={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          style={{
            width:44, height:44, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            border:'none', background:'transparent', cursor:'pointer', padding:0,
            fontSize:19, lineHeight:1, borderRadius:10,
            color: isFav ? '#ffb400' : '#d1d1d6',
            WebkitTapHighlightColor:'transparent',
          }}>{isFav ? '★' : '☆'}</button>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, color:'#1c1c1e', fontWeight:600, lineHeight:1.3 }}>{item.name}</div>
          {(showCategory || item.note) && (
            <div style={{ fontSize:11, color:'#aeaeb2', marginTop:3 }}>
              {showCategory && <span style={{ color:'#8e8e93' }}>{item.icon} {item.category}{item.note ? ' · ' : ''}</span>}
              {item.note}
            </div>
          )}
        </div>

        {/* 수량 항목 — 100g 단위로 뽑는다. 행 클릭으로 넘어가지 않게 막는다. */}
        {item.per && (
          <div style={{ display:'flex', alignItems:'center', gap:2, flexShrink:0 }}
               onClick={e => e.stopPropagation()}>
            <StepBtn label="−" onClick={() => setQtys(p => ({ ...p, [item.id]: Math.max(item.per, p[item.id] - item.per) }))} />
            <span style={{ fontSize:13, fontWeight:700, color:'#1c1c1e', minWidth:46, textAlign:'center', fontVariantNumeric:'tabular-nums' }}>
              {qty}{item.unit}
            </span>
            <StepBtn label="+" onClick={() => setQtys(p => ({ ...p, [item.id]: p[item.id] + item.per }))} />
          </div>
        )}

        <span style={{
          flexShrink:0, fontSize:15, fontWeight:700, fontVariantNumeric:'tabular-nums',
          color: price ? '#007aff' : '#c7c7cc',
        }}>
          {price ? `${price.toLocaleString()}원` : '금액입력'}
        </span>

        {/* 누를 수 있는 줄이라는 신호 */}
        <span style={{ flexShrink:0, fontSize:16, color:'#c7c7cc', lineHeight:1 }}>›</span>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight:'92svh', display:'flex', flexDirection:'column' }}>
        <div className="modal-handle" />
        <div style={{ padding:'14px 20px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:18, fontWeight:700, color:'#1c1c1e' }}>🔧 항목 선택</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* 검색 */}
        <div style={{ padding:'10px 20px 12px' }}>
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="검색 — 예: 브레, 쇼바, 얼라"
            style={{
              width:'100%', height:42, borderRadius:12, border:'1.5px solid #e5e5ea',
              background:'#f7f7f9', padding:'0 14px', fontSize:15, fontFamily:'inherit',
              color:'#1c1c1e', outline:'none', boxSizing:'border-box',
            }}
            onFocus={e => e.target.style.borderColor = '#007aff'}
            onBlur={e => e.target.style.borderColor = '#e5e5ea'}
          />
        </div>

        <div style={{ overflowY:'auto', padding:'0 20px 40px', display:'flex', flexDirection:'column', gap:8 }}>
          {q ? (
            /* ── 검색 결과 ── */
            hits.length ? (
              <div style={{ borderRadius:16, border:'1.5px solid #e5e5ea', overflow:'hidden' }}>
                {hits.map((item, j) => <ItemRow key={item.id} item={item} showCategory first={j === 0} />)}
              </div>
            ) : (
              <div style={{ textAlign:'center', color:'#aeaeb2', fontSize:14, padding:'40px 0' }}>
                「{query}」 에 맞는 항목이 없습니다
              </div>
            )
          ) : (
            <>
              {/* ── 즐겨찾기 — 자리가 움직이지 않는 4×2 그리드 ── */}
              {favItems.length > 0 && (
                <div style={{ marginBottom:4 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:'#8e8e93', letterSpacing:'0.05em', padding:'0 2px 8px' }}>
                    ★ 자주 쓰는 항목
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8 }}>
                    {favItems.map(item => {
                      const qty = qtys[item.id]
                      const price = item.per ? item.price * (qty / item.per) : item.price
                      return (
                        <button key={item.id} onClick={() => pick(item)} style={{
                          display:'flex', flexDirection:'column', justifyContent:'space-between',
                          gap:6, minHeight:66, padding:'10px 12px',
                          borderRadius:14, border:'1.5px solid #ffd980', background:'#fffaf0',
                          cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                          WebkitTapHighlightColor:'transparent',
                        }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'#1c1c1e', lineHeight:1.3 }}>
                            {item.name}{item.per ? ` ${qty}${item.unit}` : ''}
                          </span>
                          <span style={{ fontSize:14, fontWeight:800, color: price ? '#b8860b' : '#c7c7cc', fontVariantNumeric:'tabular-nums' }}>
                            {price ? `${price.toLocaleString()}원` : '금액입력'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── 계통별 아코디언 ── */}
              {OTHER_PRESETS.map((cat, i) => {
                const isOpen = openIdx === i
                return (
                  <div key={cat.category} style={{
                    borderRadius: 16,
                    border: `1.5px solid ${isOpen ? '#1c1c1e' : '#e5e5ea'}`,
                    overflow: 'hidden',
                    transition: 'border-color 0.15s',
                  }}>
                    <button
                      onClick={() => setOpenIdx(isOpen ? -1 : i)}
                      style={{
                        width:'100%', display:'flex', alignItems:'center', gap:10,
                        padding:'14px 16px', border:'none',
                        background: isOpen ? '#1c1c1e' : '#fafafa',
                        cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                        transition:'background 0.15s',
                      }}
                    >
                      <span style={{ fontSize:20 }}>{cat.icon}</span>
                      <span style={{ flex:1, fontSize:15, fontWeight:700,
                        color: isOpen ? '#fff' : '#1c1c1e' }}>
                        {cat.category}
                      </span>
                      <span style={{ fontSize:12, color: isOpen ? 'rgba(255,255,255,0.5)' : '#aeaeb2' }}>
                        {cat.items.length}개
                      </span>
                      <span style={{
                        fontSize:16, color: isOpen ? '#fff' : '#c7c7cc',
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition:'transform 0.2s', display:'inline-block',
                      }}>⌄</span>
                    </button>

                    {isOpen && cat.items.map((item, j) => (
                      <ItemRow key={item.id} item={item} first={j === 0} />
                    ))}
                  </div>
                )
              })}

              <div style={{ fontSize:11, color:'#aeaeb2', textAlign:'center', padding:'8px 0 0' }}>
                ☆ 를 누르면 자주 쓰는 항목에 고정됩니다
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StepBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:28, height:28, borderRadius:8, border:'1px solid #e5e5ea',
      background:'#fff', cursor:'pointer', fontFamily:'inherit',
      fontSize:15, fontWeight:700, color:'#1c1c1e', lineHeight:1,
      display:'flex', alignItems:'center', justifyContent:'center', padding:0,
      WebkitTapHighlightColor:'transparent',
    }}>{label}</button>
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

  // 직원 목록은 DB에서 받는다 (하드코딩하면 id가 어긋나 담당자 지정이 조용히 실패한다)
  const [mechanics, setMechanics] = useState([])
  useEffect(() => {
    mechanicApi.getAll()
      .then(setMechanics)
      .catch(e => console.warn('직원 목록 조회 실패:', e.message))
  }, [])

  // 차종이 확정되면 권장 엔진오일 사양을 미리 조회해 둔다
  const [oilSpec, setOilSpec]         = useState(null)
  const [oilSpecLoading, setOilSpecLoading] = useState(false)

  // 차종을 직접 고칠 수도 있으므로 디바운스 후 조회한다
  useEffect(() => {
    if (!model.trim()) { setOilSpec(null); return }
    let cancelled = false
    setOilSpecLoading(true)
    const t = setTimeout(async () => {
      try {
        const spec = await fetchOilSpec({ model, year, vin })
        // 모르는 차를 아는 척하면 오히려 위험하다 — 확신 없는 결과는 버린다
        if (!cancelled) setOilSpec(spec.recognized && spec.confidence >= 0.6 ? spec : null)
      } catch (e) {
        if (!cancelled) setOilSpec(null)
      } finally {
        if (!cancelled) setOilSpecLoading(false)
      }
    }, 800)
    return () => { cancelled = true; clearTimeout(t) }
  }, [model, year, vin])

  const [modal, setModal]           = useState(null)   // null | 'oil' | 'other'
  const [saving, setSaving]         = useState(false)
  const [ocrLoading, setOcrLoading] = useState('')     // 'plate' | 'vin' | 'odometer' | ''
  const [cameraType, setCameraType] = useState(null)   // null | 'vin' | 'plate' | 'odometer'
  const plateInputRef = useRef(null)
  const vinInputRef   = useRef(null)
  const odomInputRef  = useRef(null)

  const total = items.reduce((s, it) => s + (Number(it.price) || 0), 0)
  const vinFilled = !!(vin || model || year)

  // ── OCR: 이미지 file → FastAPI 호출 ──
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
        setOdomOcr({ mileage: r.mileage ? r.mileage.toLocaleString() : '0' })
      }
    } catch (err) {
      alert(`OCR 인식 실패: ${err.message}\nOCR 서비스(포트 8001)가 실행 중인지 확인해주세요.`)
    } finally {
      setOcrLoading('')
    }
  }

  // 모든 촬영 타입 → 가이드 모달 오픈
  const triggerOcr = (type) => {
    setCameraType(type)
  }

  // 카메라 모달에서 캡처/갤러리 선택 완료
  const handleCameraCapture = (blobOrFile) => {
    const capturedType = cameraType
    setCameraType(null)
    const file = blobOrFile instanceof Blob && !(blobOrFile instanceof File)
      ? new File([blobOrFile], `capture_${capturedType}.jpg`, { type: 'image/jpeg' })
      : blobOrFile
    processOcrFile(capturedType, file)
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
        mechanicId,
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
                {ocrLoading === 'plate'
                  ? <span style={{ fontSize:12, color:'#8e8e93' }}>🔍 인식 중...</span>
                  : (
                    <div style={{ display:'flex', gap:6 }}>
                      <CameraButton label="카메라" onClick={() => triggerOcr('plate')} />
                      <GalleryButton type="plate" onFile={f => processOcrFile('plate', f)} />
                    </div>
                  )
                }
              </div>
              <input type="text" value={plateNumber} onChange={e => setPlateNumber(e.target.value)} placeholder="12가 3456" className="field-input" style={{ fontSize:26, fontWeight:900, letterSpacing:'0.06em' }} />
              {plateOcr && (
                <OcrConfirmBanner title="번호판" fields={[{ label:'차량 번호', value: plateOcr.plate_number || plateOcr.plateNumber || '인식 실패', mono:true }, { label:'신뢰도', value: plateOcr.confidence ? `${Math.round(plateOcr.confidence*100)}%` : '-' }]} onConfirm={confirmPlateOcr} onEdit={() => { setPlateOcr(null); triggerOcr('plate') }} />
              )}
            </div>

            {/* 차대번호 스티커 */}
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div className="form-label">차대번호 스티커 (차종 · 연식 · VIN 자동 인식)</div>
                {ocrLoading === 'vin' && <span style={{ fontSize:12, color:'#8e8e93' }}>🔍 인식 중...</span>}
              </div>
              {!vinFilled && !vinOcr && ocrLoading !== 'vin' && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <button onClick={() => triggerOcr('vin')} style={{
                    width:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    padding:'20px 0', gap:8, background:'#fafafa', border:'2px dashed #c7c7cc',
                    borderRadius:14, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                    WebkitTapHighlightColor:'transparent',
                  }}
                    onMouseOver={e => { e.currentTarget.style.borderColor='#007aff'; e.currentTarget.style.background='#f0f5ff' }}
                    onMouseOut={e => { e.currentTarget.style.borderColor='#c7c7cc'; e.currentTarget.style.background='#fafafa' }}
                  >
                    <div style={{ fontSize:28 }}>📷</div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#3c3c43' }}>카메라로 촬영</div>
                    <div style={{ fontSize:11, color:'#8e8e93', textAlign:'center', lineHeight:1.6 }}>가이드 프레임에 맞춰 촬영하면<br />차종 · 연식 · VIN이 자동 입력됩니다</div>
                  </button>
                  <label style={{
                    width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                    padding:'12px 0', background:'#f2f2f7', border:'1.5px solid #e5e5ea',
                    borderRadius:12, cursor:'pointer', fontFamily:'inherit',
                    fontSize:13, fontWeight:600, color:'#3c3c43',
                    WebkitTapHighlightColor:'transparent',
                  }}>
                    <span>🖼</span> 갤러리에서 선택
                    <input type="file" accept="image/*" style={{ display:'none' }}
                      onChange={e => { const f = e.target.files[0]; if(f) processOcrFile('vin', f) }} />
                  </label>
                </div>
              )}
              {vinOcr && (
                <OcrConfirmBanner title="차대번호 스티커"
                  fields={[
                    { label:'VIN', value: vinOcr.vin || '인식 실패', mono:true },
                    { label:'마지막 6자리', value: vinOcr.last_6 || (vinOcr.vin ? vinOcr.vin.slice(-6) : '-'), mono:true },
                    { label:'차종', value: vinOcr.model || '-' },
                    { label:'연식', value: vinOcr.year ? vinOcr.year+'년식' : '-' },
                    { label:'신뢰도', value: vinOcr.confidence ? `${Math.round(vinOcr.confidence*100)}%` : '-' },
                  ]}
                  onConfirm={confirmVinOcr}
                  onEdit={() => { setVinOcr(null); triggerOcr('vin') }} />
              )}
              {vinFilled && !vinOcr && (
                <div style={{ background:'#f0fdf4', border:'1.5px solid #34c759', borderRadius:14, padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#1a7a35' }}>✓ 차대번호 스티커 인식 완료</span>
                    <div style={{ display:'flex', gap:6 }}>
                      <CameraButton label="재촬영" onClick={() => triggerOcr('vin')} />
                      <GalleryButton type="vin" onFile={f => processOcrFile('vin', f)} />
                    </div>
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

                  {/* 권장 오일 사양 — 참고용, 실제 선택은 정비 내역에서 직접 누른다 */}
                  {oilSpecLoading && (
                    <div style={{ marginTop:12, fontSize:12, color:'#5a8a6a' }}>
                      🔎 이 차량 권장 엔진오일 확인 중...
                    </div>
                  )}
                  {!oilSpecLoading && oilSpec && (
                    <div style={{
                      marginTop:12, background:'#fff', border:'2px solid #34c759',
                      borderRadius:14, padding:'13px 16px',
                      boxShadow:'0 2px 10px rgba(52,199,89,0.18)',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
                        <div style={{ display:'flex', alignItems:'baseline', gap:7, flexWrap:'wrap' }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'#1a7a35' }}>🛢️ 엔진오일</span>
                          <span style={{ fontSize:28, fontWeight:900, color:'#1a7a35', letterSpacing:'-0.6px', lineHeight:1 }}>
                            {oilSpec.liters}L
                          </span>
                          <span style={{ fontSize:13, fontWeight:700, color:'#1a7a35' }}>들어갑니다</span>
                        </div>
                        <button onClick={() => setModal('oil')} className="btn btn-green btn-sm">
                          오일 고르기 →
                        </button>
                      </div>
                      <div style={{ fontSize:11, color:'#5a8a6a', marginTop:5, lineHeight:1.5 }}>
                        {oilSpec.viscosity && `${oilSpec.viscosity} · `}
                        {oilSpec.fuel_type === 'diesel' ? '디젤' : '가솔린'} — {oilSpec.note}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 주행거리 */}
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <div className="form-label">입고 시 주행거리 (km)</div>
                {ocrLoading === 'odometer'
                  ? <span style={{ fontSize:12, color:'#8e8e93' }}>🔍 인식 중...</span>
                  : (
                    <div style={{ display:'flex', gap:6 }}>
                      <CameraButton label="계기판 촬영" onClick={() => triggerOcr('odometer')} />
                      <GalleryButton type="odometer" onFile={f => processOcrFile('odometer', f)} />
                    </div>
                  )
                }
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <input type="text" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="42,180" className="field-input" style={{ flex:1, fontSize:18, fontWeight:700, fontVariantNumeric:'tabular-nums' }} />
                <span style={{ fontSize:13, color:'#8e8e93', flexShrink:0 }}>km</span>
              </div>
              {odomOcr && (
                <OcrConfirmBanner title="계기판"
                  fields={[{ label:'주행거리', value: odomOcr.mileage + ' km' }]}
                  onConfirm={confirmOdomOcr}
                  onEdit={() => { setOdomOcr(null); triggerOcr('odometer') }} />
              )}
            </div>

            {/* 담당 정비사 */}
            <div>
              <div className="form-label" style={{ marginBottom:8 }}>담당 정비사</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {mechanics.map(m => {
                  const selected = mechanicId === m.id
                  const isMe     = currentUser?.id === m.id
                  return (
                    <button key={m.id} onClick={() => setMechanicId(m.id)} style={{
                      padding:'8px 14px', borderRadius:10, border:'none', cursor:'pointer',
                      fontFamily:'inherit', fontSize:13, fontWeight:600,
                      background: selected ? '#1c1c1e' : '#f2f2f7',
                      color: selected ? '#fff' : '#3c3c43',
                      display:'flex', alignItems:'center', gap:5, transition:'all 0.15s'
                    }}>
                      <span className={m.grade === 'A' ? 'grade-a' : 'grade-b'}>{m.grade}</span>
                      {m.name}
                      {isMe && (
                        <span style={{
                          fontSize:9, fontWeight:800, padding:'1px 5px', borderRadius:5,
                          background: selected ? 'rgba(255,255,255,0.25)' : '#d1d1d6',
                          color: selected ? '#fff' : '#6c6c70', letterSpacing:'0.03em',
                        }}>나</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Repair Items ── */}
          <div className="form-section">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#8e8e93', letterSpacing:'0.08em', textTransform:'uppercase' }}>정비 내역</div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => setModal('oil')} className={`btn btn-xs ${oilSpec ? 'btn-green' : 'btn-blue'}`}>
                  🛢️ 엔진오일{oilSpec ? ` · ${oilSpec.liters}L` : ''}
                </button>
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

      {modal === 'oil'   && <OilPicker onSelect={addPreset} onClose={() => setModal(null)} oilSpec={oilSpec} />}
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
