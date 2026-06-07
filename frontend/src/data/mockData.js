export const MECHANICS = [
  { id: 1, name: '사장님', grade: 'A', role: 'admin' },
  { id: 2, name: '부장님', grade: 'A', role: 'mechanic' },
  { id: 3, name: '이수오', grade: 'B', role: 'mechanic' },
  { id: 4, name: '막내',   grade: 'B', role: 'mechanic' },
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

// ─── 기타 프리셋 카테고리 ───
export const OTHER_PRESETS = [
  {
    category: '변속기 / 유압계통',
    icon: '⚙️',
    items: [
      { id: 200, name: 'ATF 자동변속기오일 교환', note: '드레인 방식', price: 140000 },
      { id: 201, name: '브레이크오일 교환 (DOT 3)', note: 'DOT 3 전계통', price: 70000 },
      { id: 202, name: '브레이크오일 교환 (DOT 4)', note: 'DOT 4 전계통', price: 90000 },
      { id: 203, name: '냉각수 교환 (LLC 부동액)', note: '전량 교환', price: 100000 },
    ],
  },
  {
    category: '브레이크 패드',
    icon: '🛑',
    items: [
      { id: 210, name: '전(前) 브레이크 패드 교환', note: '1축 — 탈착공임 포함', price: 80000 },
      { id: 211, name: '후(後) 브레이크 패드 교환 (일반)', note: '1축 — 탈착공임 포함', price: 80000 },
      { id: 212, name: '후(後) 브레이크 패드 교환 (EPB)', note: 'Electronic Parking Brake — 리셋공임 포함', price: 90000 },
    ],
  },
  {
    category: '얼라인먼트',
    icon: '🔄',
    items: [
      { id: 220, name: '4륜 휠 얼라인먼트 (국산차)', note: '4포인트 정밀 측정/조정', price: 55000 },
      { id: 221, name: '4륜 휠 얼라인먼트 (수입차)', note: '4포인트 정밀 측정/조정', price: 65000 },
      { id: 222, name: '4륜 휠 얼라인먼트 (택시)', note: '4포인트 정밀 측정/조정', price: 40000 },
      { id: 223, name: '타이어 앞뒤 위치교환 (로테이션)', note: '4개 대각선 교환', price: 20000 },
      { id: 224, name: '휠 밸런스 (2개)', note: 'Dynamic 밸런싱', price: 20000 },
    ],
  },
  {
    category: '에어컨 가스',
    icon: '❄️',
    items: [
      { id: 240, name: '에어컨 가스 충전 R-134a 100g', note: 'R-134a (구형 — 국산·수입 범용)', price: 20000 },
      { id: 241, name: '에어컨 가스 충전 R-134a 200g', note: '', price: 40000 },
      { id: 242, name: '에어컨 가스 충전 R-134a 300g', note: '', price: 60000 },
      { id: 243, name: '에어컨 가스 충전 R-134a 400g', note: '', price: 80000 },
      { id: 244, name: '에어컨 가스 충전 R-134a 500g', note: '', price: 100000 },
      { id: 245, name: '에어컨 가스 충전 R-1234yf 100g', note: 'R-1234yf (신형 친환경 — 최신 수입차)', price: 50000 },
      { id: 246, name: '에어컨 가스 충전 R-1234yf 200g', note: '', price: 100000 },
      { id: 247, name: '에어컨 가스 충전 R-1234yf 300g', note: '', price: 150000 },
      { id: 248, name: '에어컨 가스 충전 R-1234yf 400g', note: '', price: 200000 },
    ],
  },
  {
    category: '소모품',
    icon: '🛒',
    items: [
      { id: 230, name: '항균 캐빈 에어필터 교환', note: 'PM2.5 항균 필터', price: 30000 },
      { id: 231, name: '차량용 방향제 (캔)', note: '', price: 15000 },
      { id: 232, name: '차량용 방향제 (대형)', note: '', price: 20000 },
      { id: 233, name: '항균 탈취제 시공', note: '에어컨 덕트 포함', price: 20000 },
      { id: 234, name: '타이어 펑크 수리 (스트링 플러그)', note: '지렁이 수리 — 1개소', price: 10000 },
    ],
  },
]

// ─── 차량 조회용 Demo 정비 이력 ───
export const DEMO_VEHICLE_HISTORY = {
  '12가 3456': {
    plateNumber: '12가 3456',
    model: '현대 아반떼 CN7',
    year: '2021',
    vin: 'KMHD241ABNU123456',
    records: [
      {
        id: 'R-001',
        date: '2025-11-12',
        mileage: '28,400',
        mechanicId: 3,
        items: [
          { name: 'Hyundai Xteer Top 5W-30 5L', price: 110000 },
          { name: '4륜 휠 얼라인먼트 (국산차)', price: 55000 },
        ],
        paymentType: 'CARD',
        total: 165000,
      },
      {
        id: 'R-002',
        date: '2026-02-20',
        mileage: '35,100',
        mechanicId: 2,
        items: [
          { name: 'Hyundai Xteer Top 5W-30 5L', price: 110000 },
          { name: '전(前) 브레이크 패드 교환', price: 80000 },
          { name: '브레이크오일 교환 (DOT 4)', price: 90000 },
        ],
        paymentType: 'CASH',
        total: 280000,
      },
      {
        id: 'R-003',
        date: '2026-06-07',
        mileage: '42,180',
        mechanicId: 3,
        items: [
          { name: 'Hyundai Xteer Top 5W-30 7L', price: 130000 },
          { name: '4륜 휠 얼라인먼트 (국산차)', price: 55000 },
        ],
        paymentType: null,
        total: 185000,
      },
    ],
  },
  '34나 5678': {
    plateNumber: '34나 5678',
    model: 'BMW 530d (G30)',
    year: '2019',
    vin: 'WBAJF0C57KB234567',
    records: [
      {
        id: 'R-011',
        date: '2025-08-03',
        mileage: '71,200',
        mechanicId: 2,
        items: [
          { name: 'Daytona Racing Gold PAO 5W-40 C3 7L', price: 150000 },
          { name: '4륜 휠 얼라인먼트 (수입차)', price: 65000 },
        ],
        paymentType: 'CARD',
        total: 215000,
      },
      {
        id: 'R-012',
        date: '2026-06-07',
        mileage: '85,200',
        mechanicId: 2,
        items: [
          { name: '타이어 앞뒤 위치교환 (로테이션)', price: 20000 },
          { name: '에어컨 가스 충전', price: 80000 },
        ],
        paymentType: 'CASH',
        total: 100000,
      },
    ],
  },
  '56다 7890': {
    plateNumber: '56다 7890',
    model: '기아 K5 (DL3)',
    year: '2022',
    vin: 'KNAGA4231N6123456',
    records: [
      {
        id: 'R-021',
        date: '2026-04-15',
        mileage: '18,600',
        mechanicId: 1,
        items: [
          { name: 'Total Quartz Q4 5W-30 5L', price: 100000 },
          { name: '후(後) 브레이크 패드 교환 (EPB)', price: 90000 },
        ],
        paymentType: 'TRANSFER',
        total: 190000,
      },
    ],
  },
}

export const DEMO_ORDERS = [
  {
    id: 'ORD-001',
    plateNumber: '34나 5678',
    model: 'BMW 530d (G30)',
    year: '2019',
    vin: 'WBAJF0C57KB234567',
    mileage: '85,200',
    mechanicId: 2,
    items: [
      { id: 1, name: '타이어 앞뒤 위치교환 (로테이션)', price: 20000 },
      { id: 2, name: '에어컨 가스 충전', price: 80000 },
    ],
    paymentType: 'CASH',
    status: 'PAID',
    createdAt: new Date(Date.now() - 110 * 60000).toISOString(),
  },
  {
    id: 'ORD-002',
    plateNumber: '12가 3456',
    model: '현대 아반떼 CN7',
    year: '2021',
    vin: 'KMHD241ABNU123456',
    mileage: '42,180',
    mechanicId: 3,
    items: [
      { id: 1, name: 'Hyundai Xteer Top 5W-30 7L', price: 130000 },
      { id: 2, name: '4륜 휠 얼라인먼트 (국산차)', price: 55000 },
    ],
    paymentType: null,
    status: 'IN_PROGRESS',
    createdAt: new Date(Date.now() - 72 * 60000).toISOString(),
  },
]
