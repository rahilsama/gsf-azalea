# Student Tracking Web Application

Production-style student tracking system for NGOs with a **Next.js (App Router)** frontend and **Node.js + Express + Prisma + PostgreSQL** backend.

## Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT (role-based: `ADMIN`, `TEACHER`, `VOLUNTEER`)
- **Validation**: Zod
- **Password Hashing**: bcrypt
- **Docs**: Swagger (`/api-docs`)
- **Containerization**: Docker + docker-compose

---

## Project Structure

- `backend/`
  - `src/app.ts` – Express app bootstrap (CORS, Helmet, logging, Swagger, routes, error handling)
  - `src/server.ts` – HTTP server startup and Prisma connection
  - `src/config/env.ts` – environment configuration
  - `src/config/swagger.ts` – Swagger spec config
  - `src/prisma/client.ts` – singleton Prisma client
  - `src/middleware/` – logging, auth (JWT + RBAC), validation, error handling
  - `src/modules/`
    - `auth/` – register (admin-only) and login
    - `students/` – CRUD, pagination, search
    - `attendance/` – mark attendance, student history, monthly summary
    - `performance/` – add performance records, history
    - `upload/` – Excel (`.xlsx`) upload to bulk-create students with validation & dedupe
    - `dashboard/` – summary stats and students below 50% attendance
  - `prisma/schema.prisma` – User, Student, Attendance, Performance models
- `frontend/`
  - `app/(auth)/login` – login page
  - `app/(protected)/layout` – simple protected layout + logout
  - `app/(protected)/dashboard` – dashboard metrics
  - `app/(protected)/students` – students table with search + pagination
  - `app/(protected)/attendance` – attendance marking UI
  - Tailwind + Next.js config

---

## Environment Configuration

Copy `.env.example` to `.env` at the repo root and adjust values as needed:

```bash
cp .env.example .env
```

Key variables:

- **Backend**
  - `DATABASE_URL=postgresql://postgres:postgres@db:5432/student_tracking`
  - `PORT=4000`
  - `JWT_SECRET=your-strong-secret`
  - `JWT_EXPIRES_IN=1d`
  - `CORS_ORIGIN=http://localhost:3000`
- **Frontend**
  - `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api`

---

## Database & Prisma

Model highlights (simplified):

- `User`: `id`, `email`, `password`, `fullName`, `role (ADMIN|TEACHER|VOLUNTEER)`
- `Student`: `id`, `fullName`, `dateOfBirth`, `grade`, `schoolName`, `guardianName`, `contactNumber`, `enrollmentDate`, `status`, timestamps
- `Attendance`: `id`, `studentId`, `date`, `present` (unique per `studentId + date`)
- `Performance`: `id`, `studentId`, `subject`, `marks`, `examDate`

### Running Migrations

From `backend/`:

```bash
cd backend
npx prisma migrate dev --name init
```

> Ensure `DATABASE_URL` in `.env` points to your Postgres instance.

---

## Running Locally (without Docker)

### 1. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

The backend will be available at `http://localhost:4000`.

- Health check: `GET /health`
- Swagger docs: `GET /api-docs`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## Running with Docker

From the repo root:

```bash
docker compose up --build
```

Services:

- `db` – Postgres on `localhost:5432`
- `backend` – API on `http://localhost:4000`
- `frontend` – Web app on `http://localhost:3000`

Run Prisma migrations into the `db` container:

```bash
docker compose run --rm backend npx prisma migrate deploy
```

---

## Authentication & Roles

- **Login**: `POST /api/auth/login`
  - Request body: `{ "email": string, "password": string }`
  - Response: `{ token, user }`
- **Register user (admin only)**: `POST /api/auth/register`
  - Requires `Authorization: Bearer <token>` with `role = ADMIN`

JWT payload includes: `id`, `email`, `role`. Role-based authorization is enforced via middleware:

- `authenticate` – verifies JWT and attaches `req.user`
- `authorize(Role.ADMIN)` – enforces required roles

The frontend stores the JWT in `localStorage` and attaches it as a Bearer token to API calls. Protected routes are implemented via a client-side `(protected)` layout that redirects to `/login` if no token is present.

---

## Core Backend Endpoints (Summary)

All protected endpoints require `Authorization: Bearer <token>`.

- **Students**
  - `GET /api/students?page=1&pageSize=10&search=...&status=active|inactive`
  - `GET /api/students/:id`
  - `POST /api/students` (ADMIN) – create student
  - `PUT /api/students/:id` (ADMIN) – update student
  - `DELETE /api/students/:id` (ADMIN) – delete student
- **Attendance**
  - `POST /api/attendance` – mark attendance for a student on a date (upsert)
  - `GET /api/attendance/student/:studentId` – attendance history
  - `GET /api/attendance/student/:studentId/monthly?month=1&year=2026` – monthly summary
- **Performance**
  - `POST /api/performance` – add performance record
  - `GET /api/performance/student/:studentId` – performance history
- **Upload**
  - `POST /api/upload/students` (ADMIN) – multipart form with `file` field (Excel `.xlsx`)
    - Validates required columns:
      - `full_name`, `date_of_birth`, `grade`, `school_name`, `guardian_name`, `contact_number`, `enrollment_date`, optional `status`
    - Prevents duplicates using `full_name + date_of_birth + guardian_name`
    - Returns created IDs and per-row errors
- **Dashboard**
  - `GET /api/dashboard/summary`
    - `totalStudents`
    - `activeStudents`
    - `inactiveStudents`
    - `overallAttendancePercentage` (across all attendance records)
    - `studentsBelow50` – students with attendance \< 50%

---

## Frontend Features

All protected pages live under `app/(protected)/` and share a nav + logout:

- **Login (`/login`)**
  - Email/password form posts to `/api/auth/login`
  - On success, stores JWT + user info in `localStorage` and routes to `/dashboard`
- **Dashboard (`/dashboard`)**
  - Shows total/active/inactive students and average attendance %
  - Lists students below 50% attendance
- **Students (`/students`)**
  - Table of students with:
    - Search (name, school, guardian)
    - Pagination (page & pageSize)
  - Uses backend `/students` API
- **Attendance (`/attendance`)**
  - Select date (defaults to today)
  - Lists students with **Present/Absent** buttons
  - Calls `POST /api/attendance` per click

Styling is done with Tailwind CSS and is responsive for typical laptop/tablet screen sizes.

---

## Swagger API Documentation

Once the backend is running, open:

- `http://localhost:4000/api-docs`

You can explore and test all REST endpoints directly from this UI (add `Bearer <token>` in the Authorize modal for protected routes).

---

## Notes & Extensions

- **Error handling**: Centralized error middleware returns consistent JSON with proper status codes.
- **Logging**: HTTP logging via `morgan` and server-side error logs to stdout (ready for ingestion by a log aggregator).
- **Indexes**: Commonly queried fields (`email`, `role`, `status`, `fullName`, `grade`, relations) are indexed in Prisma schema.
- **Soft deletes / Audit logs / Multi-tenant**: Not implemented, but the current schema and service layer are structured so you can add these concerns without rewriting controllers.

# gsf-azalea