# ResourceHub — Educational Resource Sharing Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-5.2-black.svg)](https://fastify.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Automated%20Tests-green.svg)](https://vitest.dev/)

**ResourceHub** is a production-ready educational resource-sharing platform and academic library where students, researchers, and educators discover, upload, organize, bookmark, and download high-yield educational assets.

---

### 🌐 Live Public Deployment
- **Live Demo URL:** [https://resourcehub-demo-two.vercel.app](https://resourcehub-demo-two.vercel.app)
- **Technical Performance Report (التقرير التقني الشامل):** [PROJECT_REPORT.md](./PROJECT_REPORT.md)
- **Demo Accounts:** Admin (`admin@resourcehub.edu` / `AdminPassword123!`), Student (`student@resourcehub.edu` / `Password123!`)

---

## 🌟 Key Features

- **Multi-Format Resource Support**: Native handling for PDF documents, PowerPoint slides (PPT/PPTX), Word documents (DOC/DOCX), Excel spreadsheets (XLS/XLSX), and high-resolution academic figures/images.
- **In-Browser Document Previews**: Interactive in-browser PDF viewers and image previews without requiring external tools.
- **Secure File Streaming Engine**: Downloads stream directly from storage with SHA-256 integrity checks, ETag caching, and download analytics.
- **Faceted Discovery & Search**: Instant full-text search, filtering by academic discipline, level (undergraduate, postgraduate, high school), file format, and sorting by popularity or downloads.
- **Bilingual Interface (English & Arabic)**: Full RTL (Right-to-Left) layout support for Arabic and LTR for English, with dynamic direction switching.
- **Modern Theme System**: Refined Light and Dark modes with persistent user preference.
- **Study Collections & Bookmarks**: Create custom study lists (public or private) and bookmark key reference materials.
- **Moderation & Administration Portal**: Complete administrative suite with platform metrics, pending submission review, report resolution, user suspension, and audit logs.
- **Robust Role-Based Access Control (RBAC)**: Distinct permissions for `guest`, `user`, `moderator`, and `admin`.

---

## 🏗️ Architecture & Monorepo Structure

```
resourcehub/
├── apps/
│   ├── web/                    # React 19 + Vite + Tailwind + RTL/LTR Client
│   └── api/                    # Fastify + Drizzle ORM + PostgreSQL REST API
├── packages/
│   └── shared/                 # Shared TypeScript models, enums & Zod schemas
├── infrastructure/
│   └── docker/                 # Production Dockerfiles (API and Web Nginx)
├── docs/                       # Architecture diagrams & technical specifications
├── docker-compose.yml          # PostgreSQL, MinIO, Redis, API, and Web services
├── package.json
├── .env.example
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Requirements

- **Node.js**: `v20.0.0` or later
- **npm** or **pnpm**
- *(Optional)* **Docker & Docker Compose** (for containerized PostgreSQL, MinIO, and Redis)

---

### 2. Installation

Clone the repository and install dependencies:

```bash
# Install shared package dependencies
cd packages/shared && npm install && npm run build && cd ../..

# Install API dependencies
cd apps/api && npm install && cd ../..

# Install Web client dependencies
cd apps/web && npm install && cd ../..
```

---

### 3. Database Migration & Demonstration Seeding

ResourceHub supports both standard PostgreSQL (via `DATABASE_URL`) and an embedded PostgreSQL engine (`@electric-sql/pglite`) for instant zero-configuration local development.

Run migrations and seed rich academic demo data:

```bash
# Run migrations and populate academic library data
cd apps/api
npx tsx src/db/seed.ts
cd ../..
```

The seed script creates:
- Sample educational PDF resources in `apps/api/uploads/`
- Standard disciplines: Computer Science, Mathematics, Physics, Medicine, Engineering, Business
- Pre-configured academic tags: `algorithms`, `machine-learning`, `calculus`, `quantum-physics`, etc.
- Demonstration users for testing all RBAC roles.

---

### 4. Running the Development Servers

Open two terminal windows to run both servers concurrently:

#### Terminal 1 — Start Fastify REST API:
```bash
cd apps/api
npx tsx src/index.ts
```
> API runs on **http://localhost:4000**  
> Interactive Swagger API Documentation: **http://localhost:4000/api/docs**

#### Terminal 2 — Start Vite Web Frontend:
```bash
cd apps/web
npx vite --port 5173
```
> Frontend client runs on **http://localhost:5173**

---

### 5. Instant Test Accounts

You can log in manually or use the one-click **"Instant Demo Review Roles"** buttons on the Login page:

| Role | Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@resourcehub.edu` | `AdminPassword123!` | Full admin dashboard, metrics, user roles, suspensions |
| **Moderator** | `moderator@resourcehub.edu` | `Password123!` | Review pending submissions, resolve content reports |
| **Student / Scholar** | `student@resourcehub.edu` | `Password123!` | Upload resources, create collections, save bookmarks |

---

## 🧪 Running Automated Tests

Run the complete Vitest test suites:

```bash
# Run backend API integration tests (13 tests)
cd apps/api && npx vitest run && cd ../..

# Run frontend UI component tests (6 tests)
cd apps/web && npx vitest run && cd ../..
```

---

## 📦 Building for Production

Compile all packages and apps to production bundles:

```bash
# Build shared package
cd packages/shared && npm run build && cd ../..

# Build API backend
cd apps/api && npm run build && cd ../..

# Build Web client
cd apps/web && npm run build && cd ../..
```

---

## 🐳 Docker Deployment

To launch the full production environment with PostgreSQL 16, MinIO S3 object storage, Redis, API, and Nginx Web:

```bash
docker-compose up --build
```
