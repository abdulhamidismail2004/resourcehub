# ResourceHub — System Architecture & Engineering Documentation

## 1. System Overview

ResourceHub is an enterprise-grade educational resource sharing platform and academic library designed to handle peer-reviewed lecture notes, presentations, research summaries, spreadsheets, and educational media assets.

The platform is structured as a TypeScript monorepo containing:
- **`apps/web`**: Single-Page Application (SPA) powered by React 19+, Vite, Tailwind CSS, TanStack Query, and a bilingual design system (English LTR and Arabic RTL).
- **`apps/api`**: RESTful microservice built on Fastify, Drizzle ORM, OpenAPI/Swagger specifications, and strict RBAC authorization guards.
- **`packages/shared`**: Shared TypeScript types, interfaces, enums, and Zod schemas shared across both backend validation and frontend forms.
- **`infrastructure/`**: Production multi-stage Dockerfiles and Compose configurations for PostgreSQL, MinIO (S3), and Redis.

---

## 2. Architecture & Data Flow

```
                      +---------------------------------------+
                      |       Web Browser Client (SPA)        |
                      |   React 19 + Tailwind + RTL/LTR i18n  |
                      +-------------------+-------------------+
                                          |
                                          | HTTP / JSON / Cookies
                                          v
                      +-------------------+-------------------+
                      |         Fastify API Gateway           |
                      |  - Cookie / Bearer Auth & RBAC Guard  |
                      |  - Rate Limiter & Security Headers   |
                      |  - OpenAPI / Swagger Documentation    |
                      +---------+-------------------+---------+
                                |                   |
               +----------------+                   +----------------+
               |                                                     |
               v                                                     v
+-------------------------------+                     +-------------------------------+
|       Drizzle ORM Engine      |                     |   Object Storage Abstraction  |
|  - Relational PostgreSQL      |                     |  - Local Disk Driver          |
|  - Embedded PGlite Adapter    |                     |  - S3 / MinIO Compatible      |
|  - Full-Text Search Indexes   |                     |  - Sharp WebP Thumbnailer     |
+---------------+---------------+                     +---------------+---------------+
                |                                                     |
                v                                                     v
+-------------------------------+                     +-------------------------------+
|     PostgreSQL 16 Database    |                     |  Physical Storage Filesystem  |
|   (or PGlite WASM Storage)    |                     |   (or AWS S3 / MinIO Bucket)  |
+-------------------------------+                     +-------------------------------+
```

---

## 3. Database Architecture (PostgreSQL Schema)

The database schema is fully normalized and follows strict relational constraints:

### Entities:
1. **`users`**: Unique email, hashed password (Bcrypt/Argon2), display name, role (`guest`, `user`, `moderator`, `admin`), verified & suspension flags.
2. **`sessions`**: Server-side session tracking with crypto tokens and expiration timestamps.
3. **`categories`**: Standardized academic fields of study (Computer Science, Mathematics, Physics, Medicine, etc.) with URL slugs and icons.
4. **`tags` & `resource_tags`**: Many-to-many taxonomy tagging resources with keywords (`algorithms`, `machine-learning`, etc.).
5. **`resources`**: Educational resource records including title, description, subject, academic level, download/view counters, status (`pending`, `approved`, `rejected`), and visibility (`public`, `unlisted`, `private`).
6. **`resource_files`**: Physical file metadata: original filename, unique storage key, MIME type, byte size, file extension, and SHA-256 integrity checksum.
7. **`bookmarks`**: User saved resources with unique index per user/resource.
8. **`collections` & `collection_items`**: Custom user-curated study lists with public/private visibility.
9. **`download_events`**: Audit tracking of file downloads with IP address and user agents.
10. **`reports`**: Moderation flag reports filed by scholars with reason enum and resolution workflow.
11. **`moderation_actions`**: Audit log of administrative actions (approvals, rejections, bans, role changes).
12. **`notifications`**: In-app notifications for resource status and system announcements.
13. **`audit_logs`**: System audit trail capturing sensitive operations.

---

## 4. Key Architectural Decisions

### Dual Database Adapter (PostgreSQL + PGlite)
- Connects to PostgreSQL 16 via `DATABASE_URL` when Docker Compose or remote PostgreSQL is running.
- Automatically falls back to `@electric-sql/pglite` (official PostgreSQL engine compiled to WebAssembly running natively in Node.js) when running standalone without external Docker, guaranteeing zero configuration failure and full testability.

### Dual Storage Driver (Local Disk + S3 Compatible)
- Built against an abstract `IStorageDriver` interface.
- Includes path traversal protection and magic byte validation for secure local disk operations.
- Seamlessly connects to MinIO or AWS S3 by configuring `STORAGE_DRIVER=s3`.

### Streaming File Transfers & Security
- All downloads use Node.js streams (`createReadStream`) directly piping to Fastify replies.
- Avoids buffering large 50MB files in memory.
- Emits HTTP range request support, ETag checksum headers, and `Content-Disposition: attachment; filename="..."`.

### Bilingual Internationalization (English LTR & Arabic RTL)
- Integrated lightweight i18n provider with direction-aware CSS classes.
- Automatically swaps HTML `dir="rtl"` and `dir="ltr"` attributes and switches typography between `Inter` and `Noto Sans Arabic`.
