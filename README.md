# ProjectFlow 2.0 — Enterprise Project Management System

A production-ready, multi-tenant Project Management System built with modern architecture.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS + Shadcn UI |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| File Storage | MinIO |
| Auth | JWT + RBAC |
| Real-time | WebSocket (Socket.IO) |
| Reverse Proxy | Nginx |
| Deployment | Docker Compose |

## Architecture

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

## Modules

- [x] Module 1: Foundation & Architecture
- [ ] Module 2: Database Schema & Migration
- [ ] Module 3: Backend Core (NestJS)
- [ ] Module 4: Authentication & RBAC
- [ ] Module 5: Project Management
- [ ] Module 6: Task & Sprint Management
- [ ] Module 7: Kanban Board
- [ ] Module 8: Gantt Chart
- [ ] Module 9: Calendar View
- [ ] Module 10: Timesheet Tracking
- [ ] Module 11: Resource Management
- [ ] Module 12: Budget Tracking
- [ ] Module 13: Risk Management
- [ ] Module 14: Document Management
- [ ] Module 15: Dashboard Analytics
- [ ] Module 16: Real-time Notifications
- [ ] Module 17: Reports (PDF/Excel)
- [ ] Module 18: Frontend UI
- [ ] Module 19: Testing
- [ ] Module 20: CI/CD & Deployment

## Quick Start

```bash
# Clone
git clone https://github.com/jennifersindi17/ProjectManagement2.git
cd ProjectManagement2

# Start all services
docker compose up -d

# Access
# Frontend: http://localhost
# API: http://localhost/api
# Swagger: http://localhost/api/docs
# MinIO Console: http://localhost:9001
```

## Default Credentials

- **Admin:** admin@projectflow.com / admin123
- **MinIO:** minioadmin / minioadmin123

## License

- Jennifer Sindi
