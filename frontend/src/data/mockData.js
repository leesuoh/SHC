export const MECHANICS = [
  { id: 1, name: '사장님', grade: 'A', role: 'admin' },
  { id: 2, name: '부장님', grade: 'A', role: 'mechanic' },
  { id: 3, name: '이수오', grade: 'B', role: 'mechanic' },
]

export const PAYMENT_TYPES = [
  { key: 'CASH',     label: '현금',    icon: '💵', selectedClass: 'selected-cash' },
  { key: 'CARD',     label: '카드',    icon: '💳', selectedClass: 'selected-card' },
  { key: 'TRANSFER', label: '계좌이체', icon: '🏦', selectedClass: 'selected-transfer' },
  { key: 'CREDIT',   label: '미수',    icon: '📋', selectedClass: 'selected-credit' },
]

// ─── 엔진오일 ─── (공임 3만 + 에어클리너/오일필터 2만 + 오일 가격 포함)
export const ENGINE_OIL_GASOLINE = [
  {
    abbr: 'Q4',
    brand: 'Total Quartz 4',
    grade: '5W-30 SN',
    desc: '가솔린/LPG 범용 — 중급형',
    color: '#6b7280',
    liters: [
      { l: 3, price: 80000 }, { l: 4, price: 90000 },
      { l: 5, price: 100000 }, { l: 6, price: 110000 },
      { l: 7, price: 120000 }, { l: 8, price: 130000 },
    ],
  },
  {
    abbr: 'Q1',
    brand: 'Total Quartz 1',
    grade: '5W-40 SN PLUS',
    desc: '가솔린/LPG GDI 엔진 최적화',
    color: '#2196f3',
    liters: [
      { l: 3, price: 100000 }, { l: 4, price: 110000 },
      { l: 5, price: 110000 }, { l: 6, price: 120000 },
      { l: 7, price: 130000 }, { l: 8, price: 140000 },
    ],
  },
  {
    abbr: 'TOP',
    brand: 'Hyundai Xteer Top',
    grade: '5W-30 SP',
    desc: '현대/기아 순정 추천 — 고급형',
    color: '#b8860b',
    liters: [
      { l: 3, price: 100000 }, { l: 4, price: 110000 },
      { l: 5, price: 110000 }, { l: 6, price: 120000 },
      { l: 7, price: 130000 }, { l: 8, price: 140000 },
    ],
  },
  {
    abbr: 'MN',
    brand: 'Mannol 7707',
    grade: '0W-30 SN',
    desc: '독일 풀합성 PAO+에스테르 블렌드',
    color: '#7c3aed',
    liters: [
      { l: 3, price: 120000 }, { l: 4, price: 130000 },
      { l: 5, price: 140000 }, { l: 6, price: 150000 },
      { l: 7, price: 160000 }, { l: 8, price: 170000 },
    ],
  },
  {
    abbr: 'PAO',
    brand: 'Daytona Racing Gold PAO',
    grade: '5W-40 SP PAO',
    desc: '풀 PAO 합성 — 고성능/터보 특화',
    color: '#dc2626',
    liters: [
      { l: 3, price: 120000 }, { l: 4, price: 130000 },
      { l: 5, price: 140000 }, { l: 6, price: 150000 },
      { l: 7, price: 160000 }, { l: 8, price: 170000 },
    ],
  },
]

export const ENGINE_OIL_DIESEL = [
  {
    abbr: 'XT',
    brand: 'Hyundai Xteer C2/C3',
    grade: '5W-30 C2/C3',
    desc: 'DPF 장착 디젤 저SAPS 엔진오일',
    color: '#2c7a2c',
    liters: [
      { l: 6, price: 100000 }, { l: 7, price: 110000 }, { l: 8, price: 120000 },
    ],
  },
  {
    abbr: 'TOP',
    brand: 'Hyundai Xteer Top',
    grade: '5W-30 C3 SP',
    desc: '현대/기아 디젤 고급형',
    color: '#b8860b',
    liters: [
      { l: 6, price: 120000 }, { l: 7, price: 130000 }, { l: 8, price: 140000 },
    ],
  },
  {
    abbr: 'PAO',
    brand: 'Daytona Racing Gold PAO',
    grade: '5W-40 C3 PAO',
    desc: '풀 PAO 합성 디젤 — 고성능 특화',
    color: '#dc2626',
    liters: [
      { l: 6, price: 140000 }, { l: 7, price: 150000 }, { l: 8, price: 160000 },
    ],
  },
  {
    abbr: 'MN',
    brand: 'Mannol Diesel',
    grade: '5W-30 C3',
    desc: '독일 풀합성 PAO 디젤 전용',
    color: '#7c3aed',
    liters: [
      { l: 6, price: 140000 }, { l: 7, price: 150000 }, { l: 8, price: 160000 },
    ],
  },
]

// ─── 정비 항목 프리셋 ───
//
// 분류 기준은 "계통" 한 가지로 통일한다.
// 이전에는 계통(변속기/유압) · 부품(브레이크 패드) · 작업(얼라인먼트) · 재료(에어컨 가스)가
// 뒤섞여 있어서, 찾는 사람이 어느 카테고리를 열어야 할지 추측할 수 없었다.
// (브레이크오일은 「변속기/유압」, 브레이크패드는 「브레이크 패드」로 갈라져 있었다.)
//
// id는 즐겨찾기가 localStorage에 저장하는 키다. 절대 재사용하지 말 것.
//   200~ 엔진·변속기   210~ 제동   220~ 타이어·휠
//   230~ 기타·판매     240~ 에어컨  260~ 하체·조향  270~ 전기·등화
//
// price 0 = 아직 공임 미정. 화면에서 직접 입력하면 된다.
//
// per/unit이 있는 항목은 "수량"이다. 에어컨 가스는 100g 단위 9줄이 아니라
// 냉매 2종 + 수량 스테퍼로 다룬다 — 용량은 항목이 아니라 양이기 때문이다.
export const OTHER_PRESETS = [
  {
    category: '엔진 · 변속기',
    icon: '🔧',
    items: [
      { id: 200, name: 'ATF 자동변속기오일 교환', note: '드레인 방식', price: 140000 },
      { id: 207, name: '수동변속기오일 교환', note: '', price: 0 },
      { id: 305, name: '디퍼렌셜(디프) 오일 교환', note: '', price: 0 },
      { id: 306, name: '트랜스퍼케이스 오일 교환', note: '4WD', price: 0 },
      { id: 203, name: '냉각수(부동액) 교환', note: '전량 교환', price: 100000 },
      { id: 208, name: '오일필터 교환', note: '', price: 0 },
      { id: 209, name: '에어클리너(에어필터) 교환', note: '', price: 0 },
      { id: 290, name: '연료필터 교환', note: '', price: 0 },
      { id: 204, name: '점화플러그 교환', note: '4기통 기준', price: 0 },
      { id: 291, name: '점화코일 교환', note: '1개', price: 0 },
      { id: 205, name: '팬벨트(구동벨트) 교환', note: '', price: 0 },
      { id: 297, name: '타이밍벨트 교환', note: '', price: 0 },
      { id: 293, name: '워터펌프 교환', note: '', price: 0 },
      { id: 294, name: '서모스탯 교환', note: '', price: 0 },
      { id: 295, name: '라디에이터 교환', note: '', price: 0 },
      { id: 296, name: '라디에이터 호스 교환', note: '', price: 0 },
      { id: 206, name: '스로틀바디 청소', note: '', price: 0 },
      { id: 292, name: '흡기 카본 클리닝', note: '', price: 0 },
      { id: 300, name: '인젝터 클리닝', note: '', price: 0 },
      { id: 298, name: '엔진 플러싱', note: '', price: 0 },
      { id: 299, name: 'PCV 밸브 교환', note: '', price: 0 },
      { id: 303, name: '밸브커버 가스켓 교환', note: '엔진오일 누유', price: 0 },
      { id: 304, name: '오일팬 가스켓 교환', note: '엔진오일 누유', price: 0 },
      { id: 302, name: '실린더헤드 가스켓 교환', note: '', price: 0 },
      { id: 307, name: 'DPF 클리닝', note: '디젤', price: 0 },
      { id: 308, name: 'EGR 밸브 청소 · 교환', note: '디젤', price: 0 },
      { id: 309, name: '요소수(AdBlue) 보충', note: '디젤', price: 0 },
    ],
  },
  {
    category: '제동',
    icon: '🛑',
    items: [
      { id: 210, name: '전(前) 브레이크 패드 교환', note: '1축 — 탈착공임 포함', price: 80000 },
      { id: 211, name: '후(後) 브레이크 패드 교환 (일반)', note: '1축 — 탈착공임 포함', price: 80000 },
      { id: 212, name: '후(後) 브레이크 패드 교환 (EPB)', note: 'Electronic Parking Brake — 리셋공임 포함', price: 90000 },
      // 27만~30만 사이라 하나로 못 박을 수 없다. 낮은 쪽을 기본값으로 넣고
      // 추가한 뒤 정비 내역에서 금액을 고치면 된다.
      { id: 214, name: '브레이크 디스크 교환', note: '27만~30만 (차종별) — 추가 후 금액 조정', price: 270000 },
      { id: 310, name: '브레이크 라이닝 교환 (드럼)', note: '1축', price: 0 },
      { id: 311, name: '브레이크 드럼 교환', note: '1축', price: 0 },
      { id: 215, name: '브레이크 캘리퍼 오버홀', note: '1개', price: 0 },
      { id: 312, name: '브레이크 캘리퍼 교환', note: '1개', price: 0 },
      { id: 313, name: '브레이크 호스 교환', note: '', price: 0 },
      { id: 201, name: '브레이크오일 교환 (DOT 3)', note: 'DOT 3 전계통', price: 70000 },
      { id: 202, name: '브레이크오일 교환 (DOT 4)', note: 'DOT 4 전계통', price: 90000 },
      { id: 314, name: '주차브레이크 케이블 조정 · 교환', note: '', price: 0 },
      { id: 315, name: 'ABS 휠센서 교환', note: '1개', price: 0 },
      { id: 316, name: '브레이크등 스위치 교환', note: '', price: 0 },
    ],
  },
  {
    category: '하체 · 조향',
    icon: '🔩',
    items: [
      { id: 260, name: '쇼크업소버(쇼바) 교환 — 앞', note: '1축 2개', price: 0 },
      { id: 261, name: '쇼크업소버(쇼바) 교환 — 뒤', note: '1축 2개', price: 0 },
      { id: 320, name: '스트럿 어퍼마운트 교환', note: '1개', price: 0 },
      { id: 321, name: '코일스프링 교환', note: '1축 2개', price: 0 },
      { id: 262, name: '로어암(로우암) 교환', note: '1개', price: 0 },
      { id: 323, name: '어퍼암 교환', note: '1개', price: 0 },
      { id: 322, name: '로어암 부싱 교환', note: '1개', price: 0 },
      { id: 263, name: '스태빌라이저 링크 교환', note: '1개', price: 0 },
      { id: 264, name: '타이로드엔드 교환', note: '1개', price: 0 },
      { id: 265, name: '볼조인트 교환', note: '1개', price: 0 },
      { id: 266, name: '등속조인트 부트 교환', note: '1개', price: 0 },
      { id: 326, name: '드라이브샤프트(등속조인트) 교환', note: '1개', price: 0 },
      { id: 325, name: '휠베어링 교환', note: '1개', price: 0 },
      { id: 324, name: '너클 교환', note: '1개', price: 0 },
      { id: 267, name: '엔진마운트 교환', note: '1개', price: 0 },
      { id: 268, name: '파워스티어링 오일 교환', note: '', price: 0 },
      { id: 328, name: '파워스티어링 펌프 교환', note: '', price: 0 },
      { id: 327, name: '스티어링 기어박스(랙) 교환', note: '', price: 0 },
      { id: 331, name: '머플러(배기) 교환', note: '', price: 0 },
      { id: 332, name: '촉매(캐탈리스트) 교환', note: '', price: 0 },
      { id: 330, name: '하체 소음 점검', note: '리프트 점검', price: 0 },
    ],
  },
  {
    category: '타이어 · 휠',
    icon: '⭕',
    items: [
      { id: 220, name: '4륜 휠 얼라인먼트 (국산차)', note: '4포인트 정밀 측정/조정', price: 55000 },
      { id: 221, name: '4륜 휠 얼라인먼트 (수입차)', note: '4포인트 정밀 측정/조정', price: 65000 },
      { id: 222, name: '4륜 휠 얼라인먼트 (택시)', note: '4포인트 정밀 측정/조정', price: 40000 },
      { id: 340, name: '타이어 교환', note: '1개 — 타이어값 별도', price: 0 },
      { id: 225, name: '타이어 탈부착', note: '1개', price: 0 },
      { id: 223, name: '타이어 앞뒤 위치교환 (로테이션)', note: '4개 대각선 교환', price: 20000 },
      { id: 224, name: '휠 밸런스 (2개)', note: 'Dynamic 밸런싱', price: 20000 },
      { id: 343, name: '휠 밸런스 (4개)', note: 'Dynamic 밸런싱', price: 0 },
      { id: 234, name: '타이어 펑크 수리 (간이식)', note: '지렁이 — 1개소', price: 10000 },
      { id: 344, name: '타이어 펑크 수리 (탈착식)', note: '내부 패치 — 1개소', price: 0 },
      { id: 341, name: 'TPMS 센서 교환', note: '1개', price: 0 },
      { id: 342, name: 'TPMS 리셋 · 등록', note: '', price: 0 },
      { id: 345, name: '질소 충전', note: '4개', price: 0 },
      { id: 346, name: '휠 볼트 · 너트 교환', note: '1개', price: 0 },
    ],
  },
  {
    category: '에어컨 · 히터',
    icon: '❄️',
    items: [
      { id: 240, name: '에어컨 가스 충전 R-134a', note: '구형 — 국산·수입 범용',
        price: 20000, per: 100, unit: 'g', defaultQty: 300 },
      { id: 245, name: '에어컨 가스 충전 R-1234yf', note: '신형 친환경 — 최신 수입차',
        price: 50000, per: 100, unit: 'g', defaultQty: 300 },
      { id: 350, name: '에어컨 가스 회수 · 진공 · 재충전', note: '가스값 별도', price: 0 },
      { id: 355, name: '에어컨 누유 점검 (형광 검사)', note: '', price: 0 },
      { id: 230, name: '항균 캐빈 에어필터 교환', note: 'PM2.5 항균 필터', price: 30000 },
      { id: 233, name: '항균 탈취제 시공', note: '에어컨 덕트 포함', price: 20000 },
      { id: 249, name: '에어컨 컴프레서 교환', note: '', price: 0 },
      { id: 351, name: '에어컨 컨덴서 교환', note: '', price: 0 },
      { id: 352, name: '리시버 드라이어 교환', note: '', price: 0 },
      { id: 353, name: '히터코어 교환', note: '', price: 0 },
      { id: 354, name: '블로워 모터 교환', note: '', price: 0 },
    ],
  },
  {
    category: '전기 · 등화',
    icon: '⚡',
    items: [
      { id: 270, name: '배터리 교환', note: '', price: 0 },
      { id: 271, name: '배터리 점검 · 충전', note: '', price: 0 },
      { id: 360, name: '배터리 센서(IBS) 리셋', note: '', price: 0 },
      { id: 276, name: '발전기(제네레이터) 교환', note: '', price: 0 },
      { id: 277, name: '시동모터(스타트모터) 교환', note: '', price: 0 },
      { id: 272, name: '전조등 전구 교환', note: '1개', price: 0 },
      { id: 273, name: '제동등 · 방향지시등 전구 교환', note: '1개', price: 0 },
      { id: 361, name: '안개등 전구 교환', note: '1개', price: 0 },
      { id: 362, name: '실내등 · 번호판등 교환', note: '1개', price: 0 },
      { id: 274, name: '와이퍼 블레이드 교환', note: '1조', price: 0 },
      { id: 363, name: '와이퍼 모터 교환', note: '', price: 0 },
      { id: 364, name: '워셔액 보충', note: '', price: 0 },
      { id: 275, name: '퓨즈 교환', note: '', price: 0 },
      { id: 365, name: '경음기(혼) 교환', note: '', price: 0 },
      { id: 366, name: '블랙박스 장착', note: '', price: 0 },
      { id: 367, name: '하이패스 · 내비게이션 장착', note: '', price: 0 },
      { id: 368, name: '전기 배선 점검', note: '', price: 0 },
    ],
  },
  {
    category: '기타 · 판매',
    icon: '🛒',
    items: [
      { id: 280, name: '진단기(스캐너) 점검', note: '', price: 0 },
      { id: 371, name: '긴급 출동 (배터리 점프)', note: '', price: 0 },
      { id: 281, name: '출장비', note: '', price: 0 },
      { id: 374, name: '차량 인수 · 인계 (딜리버리)', note: '', price: 0 },
      { id: 370, name: '자동차 정기검사 대행', note: '', price: 0 },
      { id: 372, name: '언더코팅', note: '', price: 0 },
      { id: 373, name: '실내 살균 · 클리닝', note: '', price: 0 },
      { id: 231, name: '차량용 방향제 (캔)', note: '', price: 15000 },
      { id: 232, name: '차량용 방향제 (대형)', note: '', price: 20000 },
      { id: 375, name: '기타 (직접 입력)', note: '이름과 금액을 직접 적는다', price: 0 },
    ],
  },
]

// 즐겨찾기 초기값 — 처음 켰을 때 빈 화면이면 기능이 있는지도 모른다.
// 사용자가 ★를 누르는 순간 이 값은 버려지고 사용자의 선택이 저장된다.
export const DEFAULT_FAVORITE_IDS = [210, 211, 220, 202, 240, 230, 223, 234]
