/**
 * CameraGuideModal — 가이드 프레임 카메라 오버레이
 *
 * ✅ iOS Safari 14+  ✅ Android Chrome  ✅ Desktop fallback
 *
 * props:
 *   type: 'vin' | 'plate' | 'odometer'
 *   onCapture(file: File): 캡처 완료 후 호출
 *   onClose(): 닫기
 */
import { useEffect, useRef, useState, useCallback } from 'react'

// ── 타입별 가이드 설정 ─────────────────────────────────────────────────────
const GUIDE = {
  vin: {
    title: '차대번호 스티커 촬영',
    hint: '스티커 전체가 프레임 안에 들어오도록 맞춰주세요',
    subhint: '정면·수평으로, 글씨가 선명하게 보이도록',
    wRatio: 0.88,
    hRatio: 0.28,
    color: '#007aff',
    icon: '🔢',
    orientation: 'landscape', // 가로 모드 권장
  },
  plate: {
    title: '차량 번호판 촬영',
    hint: '번호판 전체가 프레임 안에 들어오도록',
    subhint: '정면에서 수평으로 촬영하세요',
    wRatio: 0.78,
    hRatio: 0.22,
    color: '#34c759',
    icon: '🚗',
    orientation: 'landscape',
  },
  odometer: {
    title: '주행거리 계기판 촬영',
    hint: '숫자가 프레임 중앙에 오도록 맞춰주세요',
    subhint: '숫자가 선명하게 보이도록 가까이 대주세요',
    wRatio: 0.72,
    hRatio: 0.38,
    color: '#ff9500',
    icon: '🔢',
    orientation: 'portrait', // 세로 모드 자연스러움
  },
}

// getUserMedia 지원 여부
const hasGetUserMedia = () =>
  !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

export default function CameraGuideModal({ type = 'vin', onCapture, onClose }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [phase, setPhase]         = useState('starting') // starting | ready | error | captured
  const [errorMsg, setErrorMsg]   = useState('')
  const [facingBack, setFacingBack] = useState(true)
  const [isPortrait, setIsPortrait] = useState(
    () => window.innerHeight > window.innerWidth
  )

  const guide = GUIDE[type] || GUIDE.vin

  // ── 화면 방향 감지 ──
  useEffect(() => {
    const update = () => setIsPortrait(window.innerHeight > window.innerWidth)
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  // ── 스크롤 잠금 (모달 열려있는 동안) ──
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // ── 카메라 시작 ──
  const startCamera = useCallback(async (back = true) => {
    if (!hasGetUserMedia()) {
      setErrorMsg('이 브라우저는 카메라를 지원하지 않습니다.\n갤러리에서 사진을 선택해주세요.')
      setPhase('error')
      return
    }

    // 기존 스트림 정리
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setPhase('starting')

    try {
      // iOS는 exact facingMode 시 에러 가능 → ideal 사용
      const constraints = {
        video: {
          facingMode: back ? { ideal: 'environment' } : { ideal: 'user' },
          // 해상도는 ideal로 — iOS/Android 호환성을 위해 exact 사용 안 함
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (!videoRef.current) return
      const video = videoRef.current

      // iOS Safari: srcObject 설정 후 직접 play() 호출 필요
      video.srcObject = stream

      // webkit-playsinline 속성 설정 (iOS 구버전 대응)
      video.setAttribute('playsinline', '')
      video.setAttribute('webkit-playsinline', '')

      await video.play()
      setPhase('ready')
    } catch (e) {
      console.error('Camera error:', e.name, e.message)
      let msg = '카메라를 사용할 수 없습니다.\n갤러리에서 사진을 선택해주세요.'

      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        msg = '카메라 접근이 거부되었습니다.\n\n'
          + (isIOS()
            ? '설정 → Safari → 카메라 → 허용'
            : '브라우저 주소창 왼쪽 🔒 → 카메라 허용')
          + '\n\n설정 후 페이지를 새로고침 해주세요.'
      } else if (e.name === 'NotFoundError') {
        msg = '카메라를 찾을 수 없습니다.\n갤러리에서 사진을 선택해주세요.'
      } else if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
        msg = '다른 앱이 카메라를 사용 중입니다.\n잠시 후 다시 시도하거나 갤러리를 이용해주세요.'
      }
      setErrorMsg(msg)
      setPhase('error')
    }
  }, [])

  useEffect(() => {
    startCamera(true)
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [startCamera])

  // ── 카메라 전환 ──
  const toggleCamera = () => {
    const next = !facingBack
    setFacingBack(next)
    startCamera(next)
  }

  // ── 캡처 ──
  const capture = useCallback(() => {
    if (phase !== 'ready') return
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    setPhase('captured')
    setTimeout(() => setPhase('ready'), 250) // 플래시 효과 후 복귀

    const vw = video.videoWidth  || video.clientWidth
    const vh = video.videoHeight || video.clientHeight

    // 가이드 프레임 비율로 크롭
    const cropW = Math.round(vw * guide.wRatio)
    const cropH = Math.round(vh * guide.hRatio)
    const cropX = Math.round((vw - cropW) / 2)
    const cropY = Math.round((vh - cropH) / 2)

    canvas.width  = cropW
    canvas.height = cropH
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], `shc_ocr_${type}_${Date.now()}.jpg`, { type: 'image/jpeg' })
      onCapture(file)
    }, 'image/jpeg', 0.95)
  }, [phase, guide, type, onCapture])

  // ── Space 키 (데스크탑 테스트) ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && phase === 'ready') { e.preventDefault(); capture() }
      if (e.code === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, capture, onClose])

  const isCapturing = phase === 'captured'
  const showOrientationTip = isPortrait && guide.orientation === 'landscape'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        // 핀치줌/텍스트선택 방지
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* ── 상단 헤더 ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        paddingTop: 'calc(env(safe-area-inset-top, 12px) + 12px)',
        padding: '12px 16px 10px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
            {guide.icon} {guide.title}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
            {guide.hint}
          </div>
        </div>
        <button
          onTouchStart={e => { e.preventDefault(); onClose() }}
          onClick={onClose}
          style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.18)', border: 'none',
            color: '#fff', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            WebkitTapHighlightColor: 'transparent',
          }}
        >✕</button>
      </div>

      {/* ── 가로 모드 권장 안내 ── */}
      {showOrientationTip && phase === 'ready' && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 30, textAlign: 'center',
          background: 'rgba(0,0,0,0.82)', borderRadius: 16,
          padding: '20px 24px', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📱↔️</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            가로로 돌리면 더 잘 찍힙니다
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
            VIN 스티커는 가로로 긴 형태입니다
          </div>
        </div>
      )}

      {/* ── 카메라 뷰 ── */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          // 캡처 시 화이트 플래시
          filter: isCapturing ? 'brightness(3)' : 'none',
          transition: isCapturing ? 'none' : 'filter 0.25s',
          // iOS mirror 방지 (전면 카메라 시 미러 제거)
          transform: facingBack ? 'none' : 'scaleX(-1)',
        }}
      />

      {/* ── 가이드 오버레이 ── */}
      {(phase === 'ready' || phase === 'captured') && (
        <GuideOverlay guide={guide} type={type} captured={isCapturing} />
      )}

      {/* ── 에러 상태 ── */}
      {phase === 'error' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 15,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.88)', padding: 32, textAlign: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 44 }}>📷</div>
          <div style={{
            fontSize: 14, fontWeight: 600, color: '#fff',
            whiteSpace: 'pre-line', lineHeight: 1.6,
          }}>{errorMsg}</div>

          <label style={{
            marginTop: 8, padding: '12px 28px', borderRadius: 14,
            background: guide.color, color: '#fff',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            display: 'block',
          }}>
            📁 갤러리에서 선택
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) onCapture(file)
              }}
            />
          </label>

          <button
            onClick={onClose}
            style={{
              padding: '10px 24px', borderRadius: 14,
              background: 'rgba(255,255,255,0.12)', border: 'none',
              color: '#fff', fontSize: 14, cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >닫기</button>
        </div>
      )}

      {/* ── 로딩 ── */}
      {phase === 'starting' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 15,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: `3px solid rgba(255,255,255,0.2)`,
            borderTopColor: '#fff',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>카메라 시작 중...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* ── 하단 버튼 영역 ── */}
      {phase !== 'error' && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)',
          paddingTop: 16,
          background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 36,
        }}>
          {/* 갤러리 선택 */}
          <label style={{
            width: 46, height: 46, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }} title="갤러리에서 선택">
            🖼
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) onCapture(file)
              }}
            />
          </label>

          {/* 촬영 버튼 */}
          <button
            // onTouchStart: 터치 즉시 반응 (300ms 지연 제거)
            onTouchStart={(e) => { e.preventDefault(); capture() }}
            onClick={capture}
            disabled={phase !== 'ready'}
            style={{
              width: 74, height: 74, borderRadius: '50%', border: 'none',
              background: 'transparent',
              cursor: phase === 'ready' ? 'pointer' : 'default',
              padding: 0,
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="촬영"
          >
            {/* 외부 링 */}
            <div style={{
              width: 74, height: 74, borderRadius: '50%',
              border: `3px solid ${phase === 'ready' ? '#fff' : 'rgba(255,255,255,0.3)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.2s',
            }}>
              {/* 내부 원 */}
              <div style={{
                width: 58, height: 58, borderRadius: '50%',
                background: phase === 'ready' ? '#fff' : 'rgba(255,255,255,0.3)',
                transform: isCapturing ? 'scale(0.85)' : 'scale(1)',
                transition: 'transform 0.1s, background 0.2s',
              }} />
            </div>
          </button>

          {/* 카메라 전환 (전/후면) */}
          <button
            onTouchStart={(e) => { e.preventDefault(); toggleCamera() }}
            onClick={toggleCamera}
            style={{
              width: 46, height: 46, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)', border: 'none',
              color: '#fff', fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}
            title="카메라 전환"
          >🔄</button>
        </div>
      )}

      {/* 캡처용 Canvas (숨김) */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

// ── 가이드 프레임 오버레이 ────────────────────────────────────────────────
function GuideOverlay({ guide, type, captured }) {
  const padX = (1 - guide.wRatio) / 2 * 100
  const padY = (1 - guide.hRatio) / 2 * 100
  const frameW = guide.wRatio * 100
  const frameH = guide.hRatio * 100

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {/* 반투명 마스크 (SVG — 4방향) */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <mask id={`guide-mask-${type}`}>
            <rect x="0" y="0" width="100" height="100" fill="white" />
            <rect
              x={padX} y={padY}
              width={frameW} height={frameH}
              rx="1.5" ry="1.5"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100" height="100"
          fill="rgba(0,0,0,0.52)"
          mask={`url(#guide-mask-${type})`}
        />
      </svg>

      {/* 프레임 테두리 */}
      <div style={{
        position: 'absolute',
        left: `${padX}%`, top: `${padY}%`,
        width: `${frameW}%`, height: `${frameH}%`,
        borderRadius: 10,
        outline: `2.5px solid ${captured ? '#fff' : guide.color}`,
        transition: 'outline-color 0.15s',
      }}>
        {/* 4 모서리 L자 */}
        {[
          { top: -2, left: -2,     borderTop: `3px solid ${guide.color}`,    borderLeft: `3px solid ${guide.color}` },
          { top: -2, right: -2,    borderTop: `3px solid ${guide.color}`,    borderRight: `3px solid ${guide.color}` },
          { bottom: -2, left: -2,  borderBottom: `3px solid ${guide.color}`, borderLeft: `3px solid ${guide.color}` },
          { bottom: -2, right: -2, borderBottom: `3px solid ${guide.color}`, borderRight: `3px solid ${guide.color}` },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', width: 22, height: 22, ...s }} />
        ))}

        {/* 중앙 가로 기준선 */}
        <div style={{
          position: 'absolute', top: '50%', left: '4%', right: '4%',
          height: 1,
          background: `${guide.color}50`,
          transform: 'translateY(-50%)',
        }} />
      </div>

      {/* 프레임 아래 보조 텍스트 */}
      <div style={{
        position: 'absolute',
        top: `${padY + frameH}%`,
        left: `${padX}%`, width: `${frameW}%`,
        marginTop: 10,
        textAlign: 'center',
        paddingTop: 10,
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
          {guide.subhint}
        </div>
      </div>
    </div>
  )
}

// ── 유틸 ────────────────────────────────────────────────────────────────────
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}
