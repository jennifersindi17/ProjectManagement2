# ProjectFlow 2.0 — Enterprise Project Management System

A production-ready, full-stack project management system built with modern architecture.

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Nginx     │────▶│  Next.js 15  │────▶│   NestJS    │
│  (Reverse   │     │  (Frontend)  │     │  (Backend)  │
│   Proxy)    │     │              │     │             │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                                    ┌───────────┼───────────┐
                                    │           │           │
                              ┌─────▼───┐ ┌────▼────┐ ┌───▼────┐
                              │PostgreSQL│ │  Redis  │ │ MinIO  │
                              └─────────┘ └─────────┘ └────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- Git

### Docker Deployment

```bash
# Clone repository
git clone https://github.com/jennifersindi17/ProjectManagement2.git
cd ProjectManagement2

# Start all services
docker compose up -d

# Access
# Frontend: http://localhost
# API: http://localhost/api
# Swagger Docs: http://localhost/api/docs
# MinIO Console: http://localhost:9001
```

### Local Development

```bash
# Start infrastructure only
docker compose -f docker-compose.dev.yml up -d

# Backend
cd backend
npm install
npm run start:dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## 🔑 Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| Admin | admin@projectflow.com | admin123 |
| MinIO | minioadmin | minioadmin123 |

## 📁 Project Structure

```
ProjectManagement2/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── config/            # Configuration
│   │   ├── common/            # Shared utilities
│   │   │   ├── decorators/    # Custom decorators
│   │   │   ├── filters/       # Exception filters
│   │   │   ├── guards/        # Auth guards
│   │   │   ├── interceptors/  # Interceptors
│   │   │   ├── pipes/         # Validation pipes
│   │   │   └── utils/         # Helpers
│   │   └── modules/           # Feature modules
│   │       ├── auth/          # Authentication
│   │       ├── users/         # User management
│   │       ├── projects/      # Project CRUD
│   │       ├── tasks/         # Task management
│   │       ├── sprints/       # Sprint management
│   │       ├── timesheets/    # Time tracking
│   │       ├── issues/        # Issue tracking
│   │       ├── risks/         # Risk management
│   │       ├── change-requests/# Change requests
│   │       ├── documents/     # Document management
│   │       ├── meetings/      # Meeting management
│   │       ├── notifications/ # Notifications
│   │       ├── audit/         # Audit logs
│   │       ├── dashboard/     # Dashboard analytics
│   │       └── budget/        # Budget tracking
│   ├── Dockerfile
│   └── package.json
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/               # App router pages
│   │   │   ├── auth/          # Login page
│   │   │   └── dashboard/     # Dashboard layout + pages
│   │   ├── components/        # Reusable components
│   │   ├── lib/               # API client + utils
│   │   └── store/             # State management
│   ├── Dockerfile
│   └── package.json
├── nginx/                      # Nginx config
├── scripts/                    # DB init + seed
├── docker-compose.yml          # Production
├── docker-compose.dev.yml      # Development
└── README.md
```

## 🗄️ Database Schema

### Core Tables (20+)
- **users** — User accounts with RBAC
- **projects** — Project master data
- **tasks** — Task management with auto-generated codes
- **sprints** — Sprint/iteration tracking
- **timesheets** — Time entry tracking
- **issues** — Bug/issue tracking
- **risks** — Risk register with scoring
- **change_requests** — Change management
- **documents** — Document management
- **meetings** — Meeting scheduling + MOM
- **notifications** — User notifications
- **audit_logs** — Complete audit trail
- **activity_logs** — Activity feed
- **budget_entries** — Budget tracking
- **project_members** — Team membership
- **meeting_participants** — Meeting attendees
- **user_sessions** — Session management
- **refresh_tokens** — Token management
- **schema_migrations** — Migration tracking

### Key Features
- ✅ Auto-generated codes (PRJ-0001, TSK-0001, ISS-0001, RSK-0001, CR-0001)
- ✅ Soft delete everywhere (deleted_at)
- ✅ Auto-updated timestamps (triggers)
- ✅ Auto-calculated project completion
- ✅ Risk scoring (probability × impact)
- ✅ RBAC with 8 roles
- ✅ Audit trail for all mutations

## 🔐 RBAC Roles

| Role | Permissions |
|------|------------|
| super_admin | Full access to everything |
| director | Read all, manage reports |
| pmo | Manage projects, tasks, reports |
| project_manager | Manage assigned projects |
| team_lead | Manage team tasks |
| developer | Read projects, update own tasks |
| qa | Read projects, manage issues |
| client | Read own projects only |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Register (admin)
- `POST /api/auth/refresh` — Refresh token
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current user

### CRUD Modules (all follow same pattern)
- `GET /api/{resource}` — List (paginated)
- `GET /api/{resource}/:id` — Detail
- `POST /api/{resource}` — Create
- `PATCH /api/{resource}/:id` — Update
- `DELETE /api/{resource}/:id` — Soft delete

### Special Endpoints
- `GET /api/dashboard/stats` — Dashboard statistics
- `GET /api/notifications/unread-count` — Unread notifications
- `PATCH /api/timesheets/:id/approve` — Approve timesheet
- `GET /api/budget/summary?projectId=` — Budget summary

## 🧪 Running Tests

```bash
# Backend tests
cd backend
npm run test
npm run test:cov

# Frontend tests
cd frontend
npm run test
```

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | NestJS 10, TypeScript |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| File Storage | MinIO |
| Auth | JWT + Passport |
| Real-time | Socket.IO |
| Reverse Proxy | Nginx |
| Deployment | Docker Compose |

## 📄 License

Jennifer Sindi
