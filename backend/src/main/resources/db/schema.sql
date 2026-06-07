-- ============================================================
-- SHC (Smart Handling for Cars)
-- 시화카 정비소 — PostgreSQL Schema
-- ============================================================

-- UUID 확장 (PK로 UUID 사용)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 1. 직원 (Mechanics)
-- ============================================================
CREATE TABLE mechanics (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(20)  NOT NULL,
    role        VARCHAR(10)  NOT NULL DEFAULT 'mechanic',  -- 'admin' | 'mechanic'
    grade       CHAR(1)      NOT NULL DEFAULT 'B',          -- 'A' | 'B'
    pin_hash    VARCHAR(255) NOT NULL,                       -- BCrypt 해시 (절대 평문 저장 금지)
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT mechanics_role_check  CHECK (role IN ('admin', 'mechanic')),
    CONSTRAINT mechanics_grade_check CHECK (grade IN ('A', 'B'))
);

COMMENT ON TABLE  mechanics           IS '정비소 직원 — PIN 로그인 기반';
COMMENT ON COLUMN mechanics.pin_hash  IS 'BCrypt 해시값. Spring Security BCryptPasswordEncoder 사용';
COMMENT ON COLUMN mechanics.is_active IS 'FALSE = 퇴사/비활성. 삭제하지 않고 비활성화';


-- ============================================================
-- 2. 차량 (Vehicles)
-- ============================================================
CREATE TABLE vehicles (
    id           SERIAL PRIMARY KEY,
    plate_number VARCHAR(20)  NOT NULL UNIQUE,   -- "12가 3456" — 조회 기준 키
    model        VARCHAR(100),                    -- "현대 아반떼 CN7"
    year         SMALLINT,                        -- 2021
    vin          VARCHAR(17),                     -- 차대번호 17자리 (ISO 3779)
    fuel_type    VARCHAR(10),                     -- 'gasoline' | 'diesel' | 'lpg' | 'ev' | 'hybrid'
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT vehicles_year_check      CHECK (year  BETWEEN 1900 AND 2100),
    CONSTRAINT vehicles_fuel_type_check CHECK (fuel_type IN ('gasoline','diesel','lpg','ev','hybrid') OR fuel_type IS NULL)
);

CREATE INDEX idx_vehicles_plate ON vehicles (plate_number);

COMMENT ON TABLE  vehicles              IS '차량 마스터. 번호판 기준으로 이력 누적';
COMMENT ON COLUMN vehicles.plate_number IS '공백 포함 원본 그대로 저장 — "12가 3456"';
COMMENT ON COLUMN vehicles.vin          IS 'OCR로 자동 추출 또는 수동 입력. 17자리 표준';


-- ============================================================
-- 3. 정비 주문 (Orders)
--    차량 입고 1회 = Order 1건
-- ============================================================
CREATE TABLE orders (
    id           BIGSERIAL    PRIMARY KEY,
    vehicle_id   INT          NOT NULL REFERENCES vehicles(id),
    mechanic_id  INT          NOT NULL REFERENCES mechanics(id),
    mileage      INT,                              -- 입고 시점 주행거리 (km)
    status       VARCHAR(20)  NOT NULL DEFAULT 'IN_PROGRESS',
    notes        TEXT,                             -- 메모/특이사항
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT orders_status_check  CHECK (status IN (
        'IN_PROGRESS',    -- 정비 중
        'DONE',           -- 정비 완료, 결제 대기
        'PAID',           -- 결제 완료
        'CREDIT'          -- 미수 (나중에 받을 예정)
    )),
    CONSTRAINT orders_mileage_check CHECK (mileage > 0 OR mileage IS NULL)
);

CREATE INDEX idx_orders_vehicle_id   ON orders (vehicle_id);
CREATE INDEX idx_orders_mechanic_id  ON orders (mechanic_id);
CREATE INDEX idx_orders_status       ON orders (status);
CREATE INDEX idx_orders_created_at   ON orders (created_at DESC);  -- 오늘의 정비 조회용

COMMENT ON TABLE  orders         IS '정비 주문. 입고 1회 = 1건';
COMMENT ON COLUMN orders.status  IS 'IN_PROGRESS → DONE → PAID / CREDIT';


-- ============================================================
-- 4. 정비 항목 (Order Items)
--    주문 1건에 N개의 항목
-- ============================================================
CREATE TABLE order_items (
    id           BIGSERIAL    PRIMARY KEY,
    order_id     BIGINT       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_type    VARCHAR(20)  NOT NULL DEFAULT 'CUSTOM',
    name         VARCHAR(200) NOT NULL,            -- "Hyundai Xteer Top 5W-30 4L"
    quantity     SMALLINT     NOT NULL DEFAULT 1,
    unit_price   INT          NOT NULL,             -- 원 단위
    total_price  INT          NOT NULL,             -- unit_price * quantity
    -- 엔진오일 전용 추가 정보 (NULL 허용 — 다른 항목엔 불필요)
    oil_brand    VARCHAR(50),                       -- "TOP", "MN", "PAO", "Q4", "Q1", "XT"
    oil_liters   NUMERIC(4,1),                      -- 4.0, 7.0
    sort_order   SMALLINT     NOT NULL DEFAULT 0,   -- 화면 표시 순서

    CONSTRAINT order_items_item_type_check CHECK (item_type IN (
        'ENGINE_OIL',   -- 엔진오일
        'PRESET',       -- 기타 프리셋 (브레이크, 에어컨 가스 등)
        'CUSTOM'        -- 직접 입력
    )),
    CONSTRAINT order_items_price_check    CHECK (unit_price >= 0 AND total_price >= 0),
    CONSTRAINT order_items_quantity_check CHECK (quantity > 0)
);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);

COMMENT ON TABLE  order_items            IS '주문 내 정비 항목. CASCADE 삭제';
COMMENT ON COLUMN order_items.oil_brand  IS '엔진오일일 때만 사용. 브랜드 약어';
COMMENT ON COLUMN order_items.oil_liters IS '엔진오일일 때만 사용. 리터 수';


-- ============================================================
-- 5. 결제 (Payments)
--    현금 = Dual-Lock (mechanic 신청 → admin 승인)
--    카드/이체 = 즉시 확정
-- ============================================================
CREATE TABLE payments (
    id               BIGSERIAL    PRIMARY KEY,
    order_id         BIGINT       NOT NULL REFERENCES orders(id),
    payment_type     VARCHAR(10)  NOT NULL,          -- 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT'
    amount           INT          NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'PENDING',

    -- Dual-Lock: 현금 결제 승인 추적
    requested_by     INT          REFERENCES mechanics(id),  -- 결제 신청한 직원
    approved_by      INT          REFERENCES mechanics(id),  -- 승인한 사장님 (admin)
    rejected_by      INT          REFERENCES mechanics(id),  -- 반려한 사장님

    requested_at     TIMESTAMPTZ,
    approved_at      TIMESTAMPTZ,
    rejected_at      TIMESTAMPTZ,
    reject_reason    TEXT,                            -- 반려 사유

    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT payments_type_check   CHECK (payment_type IN ('CASH','CARD','TRANSFER','CREDIT')),
    CONSTRAINT payments_status_check CHECK (status IN (
        'PENDING',    -- 초기 상태 (현금: 승인 대기 / 카드·이체: 거의 즉시 CONFIRMED로 변경)
        'CONFIRMED',  -- 결제 확정 (카드·이체 즉시, 현금은 admin 승인 후)
        'REJECTED'    -- 반려 (현금 only)
    )),
    CONSTRAINT payments_amount_check CHECK (amount > 0),
    -- 현금 승인 시 approved_by 필수
    CONSTRAINT payments_cash_approval_check CHECK (
        NOT (status = 'CONFIRMED' AND payment_type = 'CASH' AND approved_by IS NULL)
    )
);

CREATE INDEX idx_payments_order_id ON payments (order_id);
CREATE INDEX idx_payments_status   ON payments (status);  -- PENDING 목록 조회용

COMMENT ON TABLE  payments                  IS '결제 내역. 현금은 Dual-Lock 승인 필수';
COMMENT ON COLUMN payments.status           IS 'CASH: PENDING → CONFIRMED/REJECTED / 그 외: 즉시 CONFIRMED';
COMMENT ON COLUMN payments.requested_by     IS '현금 결제를 신청한 직원';
COMMENT ON COLUMN payments.approved_by      IS '현금 결제를 승인한 관리자 (admin only)';


-- ============================================================
-- 6. OCR 로그 (OCR Logs) — FastAPI 연동 후 활용
-- ============================================================
CREATE TABLE ocr_logs (
    id           BIGSERIAL    PRIMARY KEY,
    order_id     BIGINT       REFERENCES orders(id),
    ocr_type     VARCHAR(20)  NOT NULL,   -- 'PLATE' | 'VIN_STICKER' | 'ODOMETER'
    raw_result   TEXT,                    -- OCR 원본 텍스트
    parsed_value VARCHAR(200),            -- 파싱된 최종값
    confidence   NUMERIC(5,4),            -- 신뢰도 0.0000 ~ 1.0000
    image_path   VARCHAR(500),            -- S3/로컬 저장 경로 (선택)
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT ocr_logs_type_check CHECK (ocr_type IN ('PLATE','VIN_STICKER','ODOMETER'))
);

COMMENT ON TABLE ocr_logs IS 'OCR 처리 결과 로그. FastAPI → Spring Boot 저장';


-- ============================================================
-- 7. updated_at 자동 갱신 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mechanics_updated_at
    BEFORE UPDATE ON mechanics
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- 8. 초기 데이터 (직원 4명)
--    PIN: 사장님 0000 → BCrypt 해시 (실제 운영 시 교체 필수)
-- ============================================================
INSERT INTO mechanics (name, role, grade, pin_hash) VALUES
    ('사장님', 'admin',    'A', '$2a$12$placeholder_hash_boss'),
    ('부장님', 'mechanic', 'A', '$2a$12$placeholder_hash_manager'),
    ('이수오', 'mechanic', 'B', '$2a$12$placeholder_hash_isuo'),
    ('막내',   'mechanic', 'B', '$2a$12$placeholder_hash_youngest');

-- 실제 해시는 Spring Boot 기동 시 DataInitializer에서 BCrypt로 생성
-- 예: passwordEncoder.encode("0000")
