<div align="center">

<br/>

<img src="https://img.shields.io/badge/🔧-SHC-007aff?style=flat-square&labelColor=1c1c1e&color=007aff" height="28"/>

# SHC — Smart Handling for Cars

### Workshop Resource Planning System
#### Mobile-First · Role-Based · OCR-Powered

<br/>

[![Hits](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fleesuoh%2FSHC&count_bg=%23007aff&title_bg=%231c1c1e&icon=&icon_color=%23ffffff&title=views&edge_flat=true)](https://hits.seeyoufarm.com)
&nbsp;
![Status](https://img.shields.io/badge/status-in%20development-ff9500?style=flat-square&labelColor=1c1c1e)
&nbsp;
![License](https://img.shields.io/badge/license-MIT-34c759?style=flat-square&labelColor=1c1c1e)

<br/>

---

**[English](#-overview) · [한국어](#-프로젝트-개요)**

---

</div>

<br/>

## 🇬🇧 English

<br/>

## 📌 Overview

**SHC (Smart Handling for Cars)** is a full-stack Workshop Resource Planning system built for a real automotive repair shop with 4 mechanics. The project solves three concrete operational problems: **mechanic handover tracking**, **cash payment integrity**, and **manual data entry elimination via OCR**.

> **Dual purpose:** A working internal tool for daily shop operations, and a portfolio project demonstrating full-stack engineering from mobile UI to backend API to AI microservice.

<br/>

## 🎯 Problems & Solutions

### Problem 1 — Mechanic Handover
**Before:** Repair tasks were tracked on paper. When mechanics switched shifts mid-job, items were frequently missed from the final invoice, causing revenue leakage.

**Solution:** Digital work orders with persistent state. Every item added to a job is saved to the database immediately. Status transitions (`IN_PROGRESS → DONE → PAID`) are tracked per-order.

---

### Problem 2 — Cash Payment Integrity
**Before:** Cash payments had no verification step. In a cashier-less environment, there was no audit trail between the mechanic receiving cash and the owner confirming it.

**Solution:** **Dual-Lock Cash Approval** — when a mechanic submits a cash payment, it enters `PENDING` state. The shop owner must explicitly approve it from a dedicated screen before the order status changes to `PAID`. Every approval is stored with timestamp and approver ID.

---

### Problem 3 — Manual Data Entry
**Before:** Vehicle info (plate number, model, VIN, mileage) was hand-written on every job sheet.

**Solution:** Three OCR endpoints powered by **GPT-4o-mini Vision**:
- 📷 License plate photo → auto-fill vehicle number
- 📷 VIN sticker photo → auto-fill model, year, chassis number
- 📷 Odometer photo → auto-fill current mileage

<br/>

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Mobile Browser / PWA (iOS Safari)           │
│         React 19 + Vite + Tailwind CSS v4               │
└──────────────────────┬──────────────────────────────────┘
                       │  REST API  (polling every 3s)
          ┌────────────┴────────────┐
          │                         │
┌─────────▼──────────┐   ┌─────────▼──────────┐
│  Spring Boot 3.3   │   │  FastAPI (Python)   │
│  Java 17           │   │  Python 3.11        │
│                    │   │                     │
│  • Auth (JWT/PIN)  │   │  • /ocr/plate       │
│  • Order CRUD      │   │  • /ocr/vin         │
│  • Payment API     │   │  • /ocr/odometer    │
│  • Dual-Lock logic │   │  • GPT-4o-mini      │
└─────────┬──────────┘   └─────────────────────┘
          │ JPA / Hibernate
┌─────────▼──────────┐
│   PostgreSQL 16     │
│                    │
│  mechanics         │
│  vehicles          │
│  orders            │
│  order_items       │
│  payments          │
│  ocr_logs          │
└────────────────────┘
```

<br/>

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | React 19, Vite, Tailwind CSS v4 | Mobile-first, PWA |
| **Backend** | Spring Boot 3.3, Java 17 | JWT auth, JPA, REST |
| **OCR Service** | FastAPI, Python 3.11 | GPT-4o-mini Vision |
| **Database** | PostgreSQL 16 | 6 tables, audit fields |
| **Auth** | Spring Security + JJWT | PIN → BCrypt → JWT |
| **DevOps** | Docker, Docker Compose | Multi-stage builds |
| **PWA** | vite-plugin-pwa, Workbox | Installable on iOS |

</div>

<br/>

## 🔐 Authentication Flow

```
User selects name → enters 4-digit PIN
  → POST /api/auth/login  { name, pin }
  → Spring Security verifies PIN against BCrypt hash
  → JWT issued (1hr expiry)
  → All subsequent requests: Authorization: Bearer <token>
  → JwtAuthenticationFilter validates on every request
```

PIN hashes are stored using **BCrypt (cost factor 12)**. PINs are never stored in plaintext anywhere in the codebase.

<br/>

## 💳 Cash Dual-Lock Flow

```
Mechanic submits payment (CASH)
  → payments row created: status = PENDING, requested_by = mechanic_id
  → Order stays at DONE (not yet PAID)
  → Owner sees pending badge on main dashboard

Owner approves
  → payments.status → CONFIRMED, approved_by = owner_id, approved_at = now()
  → orders.status → PAID

Owner rejects
  → payments.status → REJECTED, rejected_by = owner_id, reject_reason = text
  → Order reverts to DONE for re-processing
```

Full audit trail: who requested, who approved/rejected, exact timestamps.

<br/>

## 📁 Project Structure

```
SHC/
├── frontend/                   # React 19 PWA
│   ├── src/
│   │   ├── api/client.js       # Centralized API client (fetch + JWT)
│   │   ├── views/
│   │   │   ├── LoginScreen.jsx         # PIN login with numpad
│   │   │   ├── MainBoard.jsx           # Dashboard (3s polling)
│   │   │   ├── RepairOrderForm.jsx     # A4-style work order form
│   │   │   ├── VehicleLookup.jsx       # History search by plate
│   │   │   └── CashApprovalBoard.jsx   # Owner-only approval screen
│   │   └── data/mockData.js    # Preset prices, oil brands
│   └── vite.config.js          # PWA configured
│
├── backend/                    # Spring Boot 3.3
│   └── src/main/java/com/shc/api/
│       ├── entity/             # JPA Entities (6 tables)
│       ├── repository/         # Spring Data JPA
│       ├── service/            # Business logic
│       ├── controller/         # REST endpoints
│       ├── security/           # JWT filter + BCrypt
│       └── config/             # SecurityConfig, CORS, DataInitializer
│
├── ocr-ai/                     # FastAPI OCR microservice
│   └── main.py                 # 3 endpoints: plate / vin / odometer
│
├── docker-compose.yml          # postgres + api + ocr
└── backend/src/main/resources/db/
    ├── schema.sql              # Full DDL
    └── ERD.md                  # Entity relationship diagram
```

<br/>

## 🚀 Running Locally

**Prerequisites:** Docker Desktop, Java 17, Node.js 20+

```bash
# 1. Start PostgreSQL
docker compose up -d postgres

# 2. Start Spring Boot API (auto-initializes 4 staff accounts)
cd backend
./gradlew bootRun

# 3. Start React frontend
cd frontend
npm install && npm run dev

# 4. (Optional) Start OCR service
cd ocr-ai
cp .env.example .env   # add OPENAI_API_KEY
pip install -r requirements.txt
python main.py
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Spring Boot API | http://localhost:8080 |
| FastAPI OCR | http://localhost:8001 |
| PostgreSQL | localhost:5432 |

**Demo PINs:** 사장님 (Owner) `0000` · 부장님 `1111` · 이수오 `2222` · 막내 `3333`

<br/>

## 📡 API Endpoints

```
POST   /api/auth/login              Public — PIN login, returns JWT

GET    /api/orders/today            Today's orders (role-filtered)
POST   /api/orders                  Create new work order
GET    /api/orders/:id              Single order detail
PATCH  /api/orders/:id/status       Update order status
GET    /api/orders/vehicle/:plate   Vehicle history by plate number

POST   /api/payments                Submit payment
POST   /api/payments/:id/approve    Approve cash (owner only)
POST   /api/payments/:id/reject     Reject cash (owner only)
GET    /api/payments/pending/full   Pending cash list (owner only)

POST   /ocr/plate                   License plate → plate number
POST   /ocr/vin                     VIN sticker → model, year, VIN
POST   /ocr/odometer                Odometer → mileage (km)
```

<br/>

## 🗺️ Roadmap

- [x] PIN-based login with JWT
- [x] Role-based dashboard (owner sees all, mechanic sees own)
- [x] Digital work order form (A4 layout)
- [x] Engine oil preset picker (brand colors, popular liter highlight)
- [x] Cash Dual-Lock approval system
- [x] OCR microservice (plate / VIN / odometer)
- [x] Vehicle history lookup
- [x] 3-second polling for real-time sync
- [x] PWA (installable on mobile)
- [x] Docker Compose setup
- [ ] CI/CD via GitHub Actions → AWS EC2
- [ ] Revenue analytics dashboard
- [ ] Push notifications for cash approvals
- [ ] Mechanic handover memo feature

<br/>

---

<br/>

## 🇰🇷 한국어

<br/>

## 📌 프로젝트 개요

**SHC (Smart Handling for Cars)** 는 정비사 4명이 근무하는 실제 자동차 정비소를 위해 개발한 풀스택 정비 관리 시스템입니다. 세 가지 구체적인 운영 문제를 해결합니다: **정비 인수인계 추적**, **현금 결제 무결성**, **OCR을 통한 수작업 데이터 입력 제거**.

> **이중 목적:** 일상적인 정비소 운영을 위한 실제 업무 도구이자, 모바일 UI부터 백엔드 API, AI 마이크로서비스까지 풀스택 개발 역량을 보여주는 포트폴리오 프로젝트입니다.

<br/>

## 🎯 문제 정의 및 해결책

### 문제 1 — 정비 인수인계
**기존 방식:** 정비 작업을 종이에 기록했습니다. 정비사가 작업 도중 교대할 경우 항목이 누락되어 청구서에서 빠지는 매출 손실이 발생했습니다.

**해결책:** 데이터베이스에 영구 저장되는 디지털 작업 지시서. 추가된 항목은 즉시 저장되고, 상태 전환(`IN_PROGRESS → DONE → PAID`)이 주문별로 추적됩니다.

---

### 문제 2 — 현금 결제 무결성
**기존 방식:** 현금 결제에 대한 검증 단계가 없었습니다. 캐셔가 없는 환경에서 정비사의 현금 수령과 사장님의 확인 사이에 감사 기록이 없었습니다.

**해결책:** **현금 이중 잠금(Dual-Lock) 승인** — 정비사가 현금 결제를 등록하면 `PENDING` 상태가 됩니다. 사장님이 전용 화면에서 명시적으로 승인해야만 주문 상태가 `PAID`로 변경됩니다. 모든 승인은 타임스탬프와 승인자 ID와 함께 저장됩니다.

---

### 문제 3 — 수작업 데이터 입력
**기존 방식:** 차량 정보(번호판, 차종, 차대번호, 주행거리)를 매번 수기로 작성했습니다.

**해결책:** **GPT-4o-mini Vision** 기반 OCR 엔드포인트 3개:
- 📷 번호판 사진 → 차량 번호 자동 입력
- 📷 차대번호 스티커 사진 → 차종·연식·VIN 자동 입력
- 📷 계기판 사진 → 현재 주행거리 자동 입력

<br/>

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│              모바일 브라우저 / PWA (iOS Safari)           │
│         React 19 + Vite + Tailwind CSS v4               │
└──────────────────────┬──────────────────────────────────┘
                       │  REST API  (3초마다 폴링)
          ┌────────────┴────────────┐
          │                         │
┌─────────▼──────────┐   ┌─────────▼──────────┐
│  Spring Boot 3.3   │   │  FastAPI (Python)   │
│  Java 17           │   │  Python 3.11        │
│                    │   │                     │
│  • 인증 (JWT/PIN)  │   │  • /ocr/plate       │
│  • 주문 CRUD       │   │  • /ocr/vin         │
│  • 결제 API        │   │  • /ocr/odometer    │
│  • Dual-Lock 로직  │   │  • GPT-4o-mini      │
└─────────┬──────────┘   └─────────────────────┘
          │ JPA / Hibernate
┌─────────▼──────────┐
│   PostgreSQL 16     │
│                    │
│  mechanics (직원)  │
│  vehicles  (차량)  │
│  orders    (주문)  │
│  order_items (항목)│
│  payments  (결제)  │
│  ocr_logs  (OCR)   │
└────────────────────┘
```

<br/>

## 🛠️ 기술 스택

<div align="center">

| 레이어 | 기술 | 비고 |
|--------|------|------|
| **프론트엔드** | React 19, Vite, Tailwind CSS v4 | 모바일 우선, PWA |
| **백엔드** | Spring Boot 3.3, Java 17 | JWT 인증, JPA, REST |
| **OCR 서비스** | FastAPI, Python 3.11 | GPT-4o-mini Vision |
| **데이터베이스** | PostgreSQL 16 | 6개 테이블, 감사 필드 |
| **인증** | Spring Security + JJWT | PIN → BCrypt → JWT |
| **DevOps** | Docker, Docker Compose | 멀티스테이지 빌드 |
| **PWA** | vite-plugin-pwa, Workbox | iOS 설치 가능 |

</div>

<br/>

## 🚀 로컬 실행

**사전 조건:** Docker Desktop, Java 17, Node.js 20+

```bash
# 1. PostgreSQL 시작
docker compose up -d postgres

# 2. Spring Boot API 실행 (직원 4명 계정 자동 초기화)
cd backend
./gradlew bootRun

# 3. React 프론트엔드 실행
cd frontend
npm install && npm run dev

# 4. (선택) OCR 서비스 실행
cd ocr-ai
cp .env.example .env   # OPENAI_API_KEY 입력
pip install -r requirements.txt
python main.py
```

**데모 PIN:** 사장님 `0000` · 부장님 `1111` · 이수오 `2222` · 막내 `3333`

<br/>

## 🗺️ 개발 로드맵

- [x] PIN 기반 로그인 (JWT)
- [x] 역할 기반 대시보드 (사장님=전체, 직원=본인 담당)
- [x] 디지털 정비 내역서 (A4 레이아웃)
- [x] 엔진오일 프리셋 선택기 (브랜드 색상, 인기 리터 강조)
- [x] 현금 Dual-Lock 승인 시스템
- [x] OCR 마이크로서비스 (번호판 / VIN / 계기판)
- [x] 차량 정비 이력 조회
- [x] 3초 폴링 실시간 동기화
- [x] PWA (모바일 설치 가능)
- [x] Docker Compose 환경 구성
- [ ] GitHub Actions → AWS EC2 CI/CD
- [ ] 매출 분석 대시보드
- [ ] 현금 승인 푸시 알림
- [ ] 인수인계 메모 기능

<br/>

---

<div align="center">

<sub>Built with ☕ and 🔧 by <a href="https://github.com/leesuoh">leesuoh</a></sub>

</div>
