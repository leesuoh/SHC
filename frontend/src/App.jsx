import { useState, useEffect } from 'react'
import { MECHANICS } from './data/mockData'
import LoginScreen from './views/LoginScreen'
import MainBoard from './views/MainBoard'
import RepairOrderForm from './views/RepairOrderForm'
import VehicleLookup from './views/VehicleLookup'
import CashApprovalBoard from './views/CashApprovalBoard'

const VIEW_TITLES = {
  main:     null,
  new:      '신규 정비 내역서',
  edit:     '정비 내역서',
  lookup:   '차량 조회',
  cash:     '현금 결제 승인',
}

export default function App() {
  const [loggedIn, setLoggedIn]   = useState(false)
  const [view, setView]           = useState('main')
  const [currentUser, setCurrentUser] = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)
  const [time, setTime]           = useState(new Date())

  const handleLogin = (user) => {
    setCurrentUser(user)
    setLoggedIn(true)
    setView('main')
  }

  const handleLogout = () => {
    localStorage.removeItem('shc_token')
    setLoggedIn(false)
    setCurrentUser(null)
    setView('main')
  }

  // 시계 업데이트 — Hook은 항상 최상단에 (조건문 밖)
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  // 로그인 전
  if (!loggedIn) {
    return <LoginScreen onLogin={handleLogin} />
  }

  const timeStr  = time.toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' })
  const isSubView = view !== 'main'
  const title    = VIEW_TITLES[view]

  const goMain = () => setView('main')

  return (
    <div style={{ minHeight:'100svh', background:'#f2f2f7' }}>

      {/* ── Header ── */}
      <header className="app-header" style={{ padding:'0 16px' }}>
        <div style={{ maxWidth:680, margin:'0 auto', height:56, display:'flex', alignItems:'center', gap:10 }}>

          {/* 왼쪽: 뒤로가기(서브뷰) or 로고(메인) */}
          {isSubView ? (
            /* 뒤로가기 — 탭하기 쉬운 전체 영역 */
            <button
              onClick={goMain}
              style={{
                display:'flex', alignItems:'center', gap:4,
                background:'none', border:'none', cursor:'pointer',
                fontFamily:'inherit', color:'#007aff', fontWeight:700,
                fontSize:16, padding:'10px 0', margin:0,
                flexShrink:0, WebkitTapHighlightColor:'transparent'
              }}
            >
              <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
                <path d="M9 1L1.5 8.5L9 16" stroke="#007aff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              메인
            </button>
          ) : (
            /* 로고 — 클릭 가능 */
            <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'default' }}>
              <div style={{
                width:34, height:34, borderRadius:9,
                background:'linear-gradient(145deg,#007aff,#0051d4)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:17, boxShadow:'0 2px 8px rgba(0,122,255,0.3)', flexShrink:0
              }}>🔧</div>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#1c1c1e', letterSpacing:'-0.3px', lineHeight:1.1 }}>SHC</div>
                <div style={{ fontSize:10, color:'#8e8e93', lineHeight:1.2 }}>시화카 정비소</div>
              </div>
            </div>
          )}

          {/* 중앙: 페이지 타이틀 (서브뷰) */}
          <div style={{ flex:1, textAlign:'center' }}>
            {isSubView && title && (
              <span style={{ fontSize:15, fontWeight:700, color:'#1c1c1e' }}>{title}</span>
            )}
          </div>

          {/* 오른쪽: 시계 + 유저 + 로그아웃 */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#1c1c1e', fontVariantNumeric:'tabular-nums' }}>{timeStr}</div>
            <div style={{
              background:'#f2f2f7', borderRadius:10,
              padding:'6px 10px', fontSize:13, fontWeight:600, color:'#1c1c1e',
              display:'flex', alignItems:'center', gap:6,
            }}>
              <span>{currentUser?.role === 'admin' ? '👑' : '🔧'}</span>
              <span>{currentUser?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background:'none', border:'none', cursor:'pointer',
                color:'#8e8e93', fontSize:12, fontWeight:600,
                fontFamily:'inherit', padding:'6px 8px', borderRadius:8,
                WebkitTapHighlightColor:'transparent',
              }}
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* ── Views ── */}
      {view === 'main' && (
        <MainBoard
          currentUser={currentUser}
          onNew={() => { setEditingOrder(null); setView('new') }}
          onLookup={() => setView('lookup')}
          onOpenOrder={order => { setEditingOrder(order); setView('edit') }}
          onCashApproval={() => setView('cash')}
        />
      )}

      {(view === 'new' || view === 'edit') && (
        <RepairOrderForm
          currentUser={currentUser}
          existingOrder={editingOrder}
          onBack={goMain}
        />
      )}

      {view === 'lookup' && (
        <VehicleLookup
          onBack={goMain}
          onNewOrder={prefill => {
            setEditingOrder(typeof prefill === 'string'
              ? { plateNumber: prefill, items: [] }
              : prefill ? { ...prefill, items: [] } : null)
            setView('new')
          }}
        />
      )}

      {view === 'cash' && <CashApprovalBoard />}

    </div>
  )
}
