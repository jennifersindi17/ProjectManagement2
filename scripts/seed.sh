#!/bin/bash
# ProjectFlow 2.0 — Seed Script
# Run this after docker compose up to populate demo data

echo "🌱 Seeding ProjectFlow database..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until docker exec projectflow_postgres pg_isready -U projectflow -d projectflow > /dev/null 2>&1; do
  sleep 2
done

echo "PostgreSQL is ready!"

# Run seed
docker exec -i projectflow_postgres psql -U projectflow -d projectflow << 'EOF'
-- Additional seed data can be added here
-- The initial schema already includes admin user and project_dashboard view

-- Verify data
SELECT 'Users: ' || COUNT(*)::text FROM users WHERE deleted_at IS NULL;
SELECT 'Projects: ' || COUNT(*)::text FROM projects WHERE deleted_at IS NULL;
SELECT 'Tasks: ' || COUNT(*)::text FROM tasks WHERE deleted_at IS NULL;
EOF

echo "✅ Seed completed!"
echo ""
echo "🔑 Default login: admin@projectflow.com / admin123"
echo "🌐 Frontend: http://localhost"
echo "📡 API: http://localhost/api"
echo "📖 Swagger: http://localhost/api/docs"
