🚗 SHC (Si Hwa Car) - Smart Handling for Cars

An Enterprise-grade, Mobile-First Workshop Resource Planning (WRP) and Real-time Operation Management system designed for medium-sized automotive repair shops.

This project was born out of Sihwa Car (시화카), a real-world established workshop operating successfully for 35 years. By replacing traditional paper-based handovers and redundant manual ERP entries with a modern, high-integrity digital platform, SHC empowers mechanics to easily manage vehicle specs, repair logs, and payment processes on-the-go—from the exact second a car rolls in to the moment it leaves.

📖 The Story & Development Motivation

For 35 years, Sihwa Car (시화카) relied entirely on handwritten paper job sheets. At the end of every busy day, these oil-stained papers had to be manually re-entered into an online legacy ERP system. This double-work was highly inefficient, slow, and prone to human error.

To solve this, we designed a mobile-first web app that handles the entire customer journey in real-time. Moreover, from an employer’s perspective, the system is designed with a conservative, high-integrity framework to systemically eliminate human error, operational slip-ups, and cash handling discrepancies.

🎯 Real-World Workshop Problems & Solutions

1. Mechanic Handover & Context Loss (정비사 간 인수인계 누락 해결)

The Problem: Sihwa Car operates 4 physical lifts with a full-time staff of 4 mechanics:

A-Grade Mechanics (Owner & Chief): Capable of independent advanced diagnostics and complete heavy repairs.

B-Grade Mechanics (Junior Mechanics): Less than 10 years of experience; highly capable in standard maintenance (fluid flushes, tires, wheel alignment) but do not perform heavy diagnostics.

In a high-pressure, chaotic workshop environment, context switching happens constantly. For example, while a B-grade mechanic is performing an engine oil change, a simpler urgent task arrives, and the Chief (A-grade) takes over the lift to finish up.
Verbal handovers under loud, busy conditions are rarely 100% perfect. If the junior finished the oil change and the chief only performed and billed the final wheel alignment, the engine oil service is omitted from the bill, causing direct financial leakage.

The Solution: A Real-Time Mobile Lift Dashboard representing the 4 physical lifts. Every task started is logged immediately. When a mechanic takes over, they simply tap "Handover" to change the assignee on their mobile phone while the cumulative billing record remains intact and visible to everyone.

2. Cash Integrity & Moral Hazard Prevention (현금 정산 불투명성 및 도덕적 해이 차단)

The Problem: Due to tight business margins, the workshop cannot afford a dedicated cashier. When the shop gets busy and the owner is deep in a repair, customers often do not know who the owner is. They naturally hand cash or cards directly to the mechanic who worked on their car.
While credit card transactions are safely logged by the POS terminal, cash payments pose a severe moral hazard. A mechanic receiving ten $10 bills might pocket one and hand over nine, or falsely claim the job was done on credit or remained unpaid.

The Solution: A Dual-Lock Cash Approval System. When a mechanic inputs "CASH" as the payment method on their mobile dashboard, the transaction is instantly locked across the system with a flashing 🚨 PENDING OWNER APPROVAL badge. It physically stays on the active lift monitor and cannot be archived until the shop owner checks the physical register and enters their credentials to authorize the final release. This systemically removes both the opportunity and the temptation for financial discrepancies.

3. Gut-Feeling Business to Data-Driven Decisions (감에 의존하는 운영에서 데이터 경영으로)

The Problem: Historically, shop management relied on "gut feeling". The workshop noticed sharp revenue drops at the end of every month and massive, chaotic vehicle rushes during extreme weather peaks (e.g., severe heatwaves or sudden winter drops). However, the database lacked organized historical records to prepare for these trends.

The Solution: A Time-Series Analytics Engine built on relational PostgreSQL data. By tracking vehicle service intervals and correlating them with calendar/seasonal patterns, we can analyze precisely which components (e.g., Cabin filters/Coolant in summer, Batteries/Starter motors in winter) spike during specific times. This allows us to target loyal customers with timely maintenance reminders and optimize our inventory before the seasonal rush hits.

🏗️ System Architecture

SHC is designed with a highly decoupled Microservices Architecture (MSA) to separate core transactional business logic from heavy AI computation.

                           [ Client: Progressive Web App (PWA) ]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼ (HTTPS / JSON)                            ▼ (HTTPS / Image Binary)
           ┌───────────────────────┐                     ┌────────────────────────┐
           │   Java Spring Boot    │                     │     Python FastAPI     │
           │  (Main Business Core) │                     │   (AI/OCR Microservice)│
           └───────────┬───────────┘                     └───────────┬────────────┘
                       │                                             │
                       ├──────────────────────┐                      ▼
                       ▼                      ▼               ┌─────────────┐
               ┌───────────────┐      ┌───────────────┐       │ OpenAI API  │
               │  PostgreSQL   │      │    AWS S3     │       │(gpt-4o-mini)│
               │ (Supabase DB) │      │(Photo Assets) │       └─────────────┘
               └───────────────┘      └───────────────┘


Architectural Decisions & Tech Stack Rationale

Frontend: React (Vite) + Tailwind CSS + Lucide Icons (PWA)

Rationale: Provides a seamless, desktop ERP-like view on the office PC and an easy, high-contrast, large-button mobile UI on grease-stained mechanic phones—all from a single, lightweight codebase.

Core Microservice: Java 17 (Spring Boot, Spring Security, JPA, Spring Data)

Rationale: Enforces strict transactional boundaries for financial ledger security. Spring Boot's robust enterprise ecosystem is the gold standard for backend reliability, especially valued in Singapore's tech and finance sectors.

AI & OCR Engine: Python 3.10 (FastAPI, Pydantic, HTTPX)

Rationale: Acts as an ultra-fast, asynchronous pipeline to OpenAI's Vision capabilities. It extracts license plates, dashboard mileage, and VIN details simultaneously to eliminate manual data entry.

Database: PostgreSQL (Supabase Cloud)

Rationale: Strong relational constraints and schema-based design guarantee invoice and preset pricing data consistency.

💾 Database Schema (PostgreSQL DDL)

Strict relational schema to enforce business integrity constraints:

-- 1. Users & Mechanics
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(20) NOT NULL,
    role VARCHAR(20) DEFAULT 'MECHANIC' -- 'ADMIN' (Owner), 'MECHANIC'
);

-- 2. Maintenance Catalog Preset
CREATE TABLE maintenance_presets (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) UNIQUE NOT NULL,
    default_price INT NOT NULL DEFAULT 0,
    category VARCHAR(50)
);

-- 3. Work Orders (Lift Status Tracker)
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
    is_approved_by_owner BOOLEAN DEFAULT FALSE, -- Dual-Lock Authorization
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Billing Work Items (Linked to Work Orders)
CREATE TABLE work_items (
    id SERIAL PRIMARY KEY,
    work_order_id INT REFERENCES work_orders(id) ON DELETE CASCADE,
    preset_id INT REFERENCES maintenance_presets(id) ON DELETE SET NULL,
    custom_item_name VARCHAR(100) NOT NULL,
    actual_price INT NOT NULL DEFAULT 0, -- Overridable field for flexibility
    is_completed BOOLEAN DEFAULT FALSE
);


🐳 Running Locally with Docker Compose

Ensure you have Docker and Docker Compose installed.

Clone the repository:

git clone [https://github.com/leesuoh/SHC.git](https://github.com/leesuoh/SHC.git)
cd SHC


Create a .env file in the root directory and add your secret keys:

# PostgreSQL Connection
DATABASE_URL=jdbc:postgresql://your-supabase-db:5432/postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password

# OpenAI API Key for OCR Engine
OPENAI_API_KEY=sk-proj-your-openai-api-key-here


Spin up the entire multi-container stack:

docker-compose up -d --build


Access the services:

Frontend Web App: http://localhost

Core Spring Boot API: http://localhost:8080

AI OCR FastAPI Docs: http://localhost:8000/docs

⛓️ Continuous Integration & Deployment (CI/CD)

This repository includes a production-ready GitHub Actions Pipeline (.github/workflows/deploy.yml) that triggers on every push to the main branch:

Lint & Test: Runs comprehensive JUnit tests for the Spring Boot application and PyTest for FastAPI.

Dockerize: Builds optimized multi-stage Docker images for each service.

Registry Push: Pushes built images to Docker Hub (or AWS ECR).

AWS Deployment: Securely SSHs into AWS EC2, pulls the latest images, and performs a zero-downtime container restart.
