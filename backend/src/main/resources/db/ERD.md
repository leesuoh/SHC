# SHC Database ERD

## 테이블 관계도

```
mechanics (직원)
│
├──< orders (정비 주문) >──── vehicles (차량)
│       │
│       ├──< order_items (정비 항목)
│       │
│       ├──< payments (결제)
│       │       ├── requested_by → mechanics
│       │       ├── approved_by  → mechanics
│       │       └── rejected_by  → mechanics
│       │
│       └──< ocr_logs (OCR 로그)
```

## 테이블별 핵심 컬럼

### mechanics
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL PK | |
| name | VARCHAR(20) | 사장님, 부장님, 이수오, 막내 |
| role | VARCHAR(10) | admin / mechanic |
| grade | CHAR(1) | A / B |
| pin_hash | VARCHAR(255) | BCrypt 해시 |
| is_active | BOOLEAN | 퇴사 시 FALSE |

### vehicles
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL PK | |
| plate_number | VARCHAR(20) UNIQUE | "12가 3456" — 조회 기준 |
| model | VARCHAR(100) | "현대 아반떼 CN7" |
| year | SMALLINT | 연식 |
| vin | VARCHAR(17) | 차대번호 |
| fuel_type | VARCHAR(10) | gasoline/diesel/lpg/ev/hybrid |

### orders
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL PK | |
| vehicle_id | INT FK | |
| mechanic_id | INT FK | 담당 직원 |
| mileage | INT | 입고 시 주행거리 |
| status | VARCHAR(20) | IN_PROGRESS → DONE → PAID / CREDIT |

### order_items
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL PK | |
| order_id | BIGINT FK | CASCADE 삭제 |
| item_type | VARCHAR(20) | ENGINE_OIL / PRESET / CUSTOM |
| name | VARCHAR(200) | "Xteer Top 5W-30 4L" |
| unit_price | INT | 원 단위 |
| oil_brand | VARCHAR(50) | 엔진오일 전용 |
| oil_liters | NUMERIC(4,1) | 엔진오일 전용 |

### payments
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL PK | |
| order_id | BIGINT FK | |
| payment_type | VARCHAR(10) | CASH/CARD/TRANSFER/CREDIT |
| amount | INT | 원 단위 |
| status | VARCHAR(20) | PENDING → CONFIRMED / REJECTED |
| requested_by | INT FK → mechanics | 현금 신청자 |
| approved_by | INT FK → mechanics | 현금 승인자 (admin) |

## 결제 플로우

### 카드 / 계좌이체
```
직원 결제 입력 → payments(status=CONFIRMED) 즉시 저장
                → orders(status=PAID) 업데이트
```

### 현금 Dual-Lock
```
직원 결제 신청 → payments(status=PENDING, requested_by=직원)
사장님 확인    → payments(status=CONFIRMED, approved_by=사장님)
               → orders(status=PAID)

반려 시        → payments(status=REJECTED, rejected_by=사장님, reject_reason=사유)
               → orders(status=IN_PROGRESS or DONE) 복귀
```

### 미수 (CREDIT)
```
직원 미수 처리 → payments(status=CONFIRMED, payment_type=CREDIT)
               → orders(status=CREDIT)
나중에 수금    → 새 payments 추가 또는 별도 처리
```

## 인덱스 전략

| 인덱스 | 용도 |
|--------|------|
| vehicles(plate_number) | 차량 조회 — 가장 빈번한 쿼리 |
| orders(created_at DESC) | 오늘의 정비 목록 |
| orders(mechanic_id) | 직원별 필터링 |
| orders(status) | 진행 중 / 완료 필터 |
| payments(status) | PENDING 현금 승인 대기 목록 |
