# 🚗 SHC (Smart Handling for Cars)
> **Enterprise-Grade, Mobile-First Workshop Resource Planning (WRP) & Real-Time Operation Management System**

<p align="center">
  <img src="https://img.shields.io/badge/Java-17-007396?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 17">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot">
  <img src="https://img.shields.io/badge/Python-3.10-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
</p>

---

## 🚀 Project Overview

**SHC** is a high-integrity, enterprise-grade distributed solution engineered to digitalize, streamline, and secure the daily operations of **Sihwa Car**, a prominent automotive workshop with a 35-year legacy. 

By replacing error-prone handwritten paper sheets and redundant legacy ERP data entries with a state-of-the-art **Progressive Web App (PWA)** and a highly secure **Microservices Architecture (MSA)**, SHC ensures complete transaction safety, financial integrity, and real-time synchronization across all mechanic platforms.

---

## 📖 The Business Context & Motivation

For over three decades, the workshop operated on an analog, paper-first model. This operational flow caused major efficiency bottlenecks and critical financial data drops.

### 🔴 Legacy Operational Workflow
```mermaid
graph LR
    A[Vehicle Entry] --> B[Handwritten Paper Job Sheet]
    B --> C[Mechanic Task Execution]
    C --> D[End of Day Checkout]
    D --> E[Double-Entry into Legacy ERP]
    E --> F[Manual Ledger Archiving]
    
    style B fill:#ffcccc,stroke:#333,stroke-width:2px
    style E fill:#ffcccc,stroke:#333,stroke-width:2px

- Redundant Labor: Mechanics spent valuable hours transcribing greasy, damaged paper invoices into a rigid legacy ERP system at the end of every business day, leading to operational fatigue.

- Financial Leakage: The lack of an atomic state synchronization mechanism led to forgotten billings, cash tracking errors, and total reliance on "gut-feeling" inventory and forecasting decisions.

🟢 The Engineered Solution
We engineered a highly transactional distributed system using Java Spring Boot (for core business logic and transactional integrity) and Python FastAPI (for asynchronous AI OCR vision processing), ensuring an automated, frictionless data flow from vehicle entrance to final customer checkout.

🎯 Real-World Problems & Technical Solutions
1️⃣ Problem A: Mechanic Handover & Context Loss
Eliminating communication gaps and billing omissions during high-pressure mechanic task transitions.

graph TD
    A[Junior Mechanic] -->|Starts Task: Engine Oil Flush| B(Urgent Diagnostic Vehicle Arrives)
    B -->|Verbal Handover/Noisy Environment| C[Senior Chief Mechanic Takes Over Lift]
    C -->|Completes Task: Wheel Alignment| D[Checkout & Invoice Generation]
    D -->|🔴 Financial Leakage| E(Only Wheel Alignment Billed / Oil Service Omitted)
    
    style E fill:#ffcccc,stroke:#333,stroke-width:2px

- Operational Bottleneck: The workshop operates 4 physical lifts with a full-time staff of 4 mechanics divided into two tiers: A-Grade (Owner & Chief for advanced diagnostics/heavy repairs) and B-Grade (Junior Mechanics for routine fluids, brakes, and alignment). In a fast-paced environment, junior mechanics often start routine maintenance but must hand over the lift to senior staff when an urgent diagnostic car arrives. Due to chaotic workshop conditions, verbal handovers are rarely 100% complete. If the junior mechanic completed the oil change but the chief only billed the final wheel alignment, the oil service was entirely omitted from the invoice—causing direct financial leakage.

- Engineered Solution: We designed a stateful, mobile-optimized Real-Time Lift Dashboard representing the 4 physical bays. Every single task started is logged on-the-go via mobile. During a personnel switch, the mechanic simply performs a single-tap "Handover" on their device to update the assignee. All previously marked tasks remain permanently accumulated in the active database session, guaranteeing 100% billing accuracy at checkout.

2️⃣ Problem B: Cash Integrity & Moral Hazard Prevention
Preventing internal financial leakages using systemic lockouts in a cashier-less environment.

Operational Bottleneck: Due to optimized operating margins, the workshop does not employ a dedicated cashier. When the bay gets crowded and the shop manager is deep under a chassis, customers hand credit cards or physical cash directly to the mechanic who worked on their vehicle. While credit card payments are automatically audited by the POS terminal, cash payments posed a severe moral hazard. A mechanic receiving physical cash could easily pocket a portion of the payment, or falsely claim that the car was released on credit or remained unpaid.

Engineered Solution: We implemented a robust Dual-Lock Cash Approval System directly into the transaction database state machine:

When a mechanic selects CASH as the payment method on their mobile screen, the work order state instantly transitions to PENDING_ADMIN_APPROVAL.

The specific lift is immediately locked on the main dashboard, flashing a 🚨 PENDING OWNER APPROVAL alert.

The transaction cannot be closed, and the physical lift cannot be cleared for the next vehicle, until the shop administrator physically verifies the register and inputs secure credentials to authorize the release.

3️⃣ Problem C: From "Gut-Feeling" Business to Data-Driven Decisions
Transitioning from experience-based scheduling to time-series forecasting combined with environmental variables.

Operational Bottleneck: Historically, the business was managed through "gut feeling". While the manager noticed predictable revenue drops at the end of every month and chaotic vehicle surges during seasonal temperature spikes (e.g., cooling system failures in extreme summer, battery drops in sudden winter freezes), the workshop lacked clean, structured historical data to optimize parts inventory and staff scheduling.

Engineered Solution: We built a Time-Series Business Intelligence Engine on top of our relational PostgreSQL schema:

Correlation Analysis: Analyzes historical maintenance categories against local climate indices to forecast seasonal parts demand (e.g., proactive sourcing of cabin filters/coolants in summer, and batteries/starter motors in winter).

Proactive CRM: Automatically calculates service interval lifespans for loyal clients and generates targeted marketing lists to optimize off-peak labor availability, smoothing out the workshop's utilization curve.

🏗️ System Architecture
SHC adopts a highly decoupled Microservices Architecture (MSA) to separate transactional business processing from heavy, vision-based AI computations.

                               ┌────────────────────────────────┐
                               │  Client: Progressive Web App   │
                               │    (React / Tailwind CSS)      │
                               └───────────────┬────────────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼ (REST JSON / HTTPS)                           ▼ (Image Binary / HTTPS)
           ┌───────────────────────┐                       ┌───────────────────────┐
           │   Java Spring Boot    │                       │    Python FastAPI     │
           │ (Core Transaction API)│                       │ (AI / OCR Gateway)    │
           └───────────┬───────────┘                       └───────────┬───────────┘
                       │                                               │
          ┌────────────┴────────────┐                                  ▼
          ▼                         ▼                        ┌───────────────────┐
  ┌───────────────┐         ┌───────────────┐                │    OpenAI API     │
  │  PostgreSQL   │         │    AWS S3     │                │   (gpt-4o-mini)   │
  │ (Supabase DB) │         │(Asset Bucket) │                └───────────────────┘
  └───────────────┘         └───────────────┘
🛠️ Tech Stack Rationale
📱 Frontend (React / Tailwind CSS / PWA)
Rationale: Single-codebase responsive architecture that delivers a high-contrast, large-button mobile UI for mechanics wearing grease-stained gloves, alongside a comprehensive desktop ERP dashboard for administrative PCs.

☕ Core Backend (Java 17 / Spring Boot / Spring Security / JPA)
Rationale: Chosen for its enterprise-ready transactional boundaries, rigorous isolation levels, and strict Type safety. Spring Boot serves as the robust standard for high-integrity business logic and financial transaction validation.

⚡ AI OCR Gateway (Python 3.10 / FastAPI / Uvicorn)
Rationale: A high-performance, asynchronous pipeline designed to handle concurrent image binary uploads. It communicates with OpenAI's Vision API to extract license plates, odometer mileage, and VIN details without blocking core transaction processing threads.

💾 Database Schema (PostgreSQL DDL)
Strict relational schema implemented to enforce business constraints and guarantee financial transactional safety.

-- 1. Users & Mechanics Directory
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(20) NOT NULL,
    role VARCHAR(20) DEFAULT 'MECHANIC' -- 'ADMIN' (Owner), 'MECHANIC'
);

-- 2. Master Price List & Catalog Preset
CREATE TABLE maintenance_presets (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) UNIQUE NOT NULL,
    default_price INT NOT NULL DEFAULT 0,
    category VARCHAR(50)
);

-- 3. Active Work Orders (Lift Fleet Status)
CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY,
    lift_number INT NOT NULL CHECK (lift_number BETWEEN 1 AND 4),
    car_number VARCHAR(20) NOT NULL,
    car_model VARCHAR(50),
    car_year VARCHAR(20),
    vin VARCHAR(50),
    mileage INT NOT NULL,
    status VARCHAR(20) DEFAULT 'WORKING', -- 'WORKING', 'COMPLETED', 'RELEASED'
    payment_method VARCHAR(20), -- 'CASH', 'CARD', 'TRANSFER', 'UNPAID'
    is_approved_by_owner BOOLEAN DEFAULT FALSE, -- Dual-Lock Lockout
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Billing Work Items
CREATE TABLE work_items (
    id SERIAL PRIMARY KEY,
    work_order_id INT REFERENCES work_orders(id) ON DELETE CASCADE,
    preset_id INT REFERENCES maintenance_presets(id) ON DELETE SET NULL,
    custom_item_name VARCHAR(100) NOT NULL,
    actual_price INT NOT NULL DEFAULT 0, -- Overridable field for seasonal discounts
    is_completed BOOLEAN DEFAULT FALSE
);

🐳 Local Setup & Execution
1️⃣ Prerequisite Checklist
Docker & Docker Compose installed on your local machine.

An active Supabase PostgreSQL database instance.

An OpenAI API Key (with access permissions for the gpt-4o-mini model).

2️⃣ Configuration Settings (.env)
Create a .env file in the root directory of the project and populate the following variables:

코드 스니펫
DATABASE_URL=jdbc:postgresql://your-supabase-db:5432/postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
3️⃣ Running with Docker Compose
To build and spin up the multi-container microservice environment in detached mode, run:

Bash
docker-compose up -d --build
Once initialized, you can access the active local service endpoints:

Frontend Web App: http://localhost:3000

Core Spring Boot API: http://localhost:8080/swagger-ui.html

AI OCR FastAPI Gateway: http://localhost:8000/docs

⛓️ Enterprise DevOps CI/CD Pipeline
The project implements a modern GitHub Actions Pipeline (.github/workflows/deploy.yml) for automated testing, continuous integration, and zero-downtime deployment:

[ Git Push to main ] 
         │
         ▼
[ Lint & Test (JUnit / PyTest) ] 
         │
         ▼
[ Build & Multi-Stage Dockerization ] 
         │
         ▼
[ Push to Container Registry ] 
         │
         ▼
[ Secure AWS SSH Deploy & Zero-Downtime Hot Reload ]
🛠️ GitHub Actions Workflow Steps
Continuous Integration (CI): Triggered automatically on every commit push to the main branch. Compiles Java artifacts and executes backend test suites to ensure zero compilation regressions and logic protection.

Dockerization: Builds optimized, streamlined, lightweight Alpine-based production Docker images for each decoupled microservice.

Continuous Deployment (CD): Connects securely to the designated AWS EC2 instance via SSH, pulls the newly updated container layers, and executes a graceful hot reload with zero server downtime.

