import { Pool } from 'pg';
import { randomUUID } from 'crypto';

const pool = new Pool({
  connectionString: 'postgresql://jenjen@localhost:5432/projectflow',
});

async function seed() {
  console.log('🌱 Starting seed...\n');

  // Clean existing data (except admin)
  await pool.query('DELETE FROM task_activities');
  await pool.query('DELETE FROM task_comments');
  await pool.query('DELETE FROM notifications');
  await pool.query('DELETE FROM meeting_participants');
  await pool.query('DELETE FROM meetings');
  await pool.query('DELETE FROM user_sessions');
  await pool.query('DELETE FROM refresh_tokens');
  await pool.query('DELETE FROM audit_logs');
  await pool.query('DELETE FROM activity_logs');
  await pool.query('DELETE FROM budget_entries');
  await pool.query('DELETE FROM timesheets');
  await pool.query('DELETE FROM documents');
  await pool.query('DELETE FROM change_requests');
  await pool.query('DELETE FROM risks');
  await pool.query('DELETE FROM issues');
  await pool.query('DELETE FROM tasks');
  await pool.query('DELETE FROM sprints');
  await pool.query('DELETE FROM project_members');
  await pool.query('DELETE FROM projects');
  await pool.query("DELETE FROM users WHERE email != 'admin@projectflow.com'");

  // ============================================
  // USERS
  // ============================================
  console.log('👤 Creating users...');
  const users = [
    { email: 'budi@projectflow.com', first: 'Budi', last: 'Santoso', role: 'director', dept: 'Management' },
    { email: 'siti@projectflow.com', first: 'Siti', last: 'Rahayu', role: 'project_manager', dept: 'IT' },
    { email: 'ahmad@projectflow.com', first: 'Ahmad', last: 'Wijaya', role: 'project_manager', dept: 'IT' },
    { email: 'dewi@projectflow.com', first: 'Dewi', last: 'Lestari', role: 'team_lead', dept: 'Engineering' },
    { email: 'agus@projectflow.com', first: 'Agus', last: 'Pratama', role: 'developer', dept: 'Engineering' },
    { email: 'rina@projectflow.com', first: 'Rina', last: 'Susanti', role: 'developer', dept: 'Engineering' },
    { email: 'eko@projectflow.com', first: 'Eko', last: 'Prasetyo', role: 'qa', dept: 'Quality Assurance' },
    { email: 'maya@projectflow.com', first: 'Maya', last: 'Anggraini', role: 'pmo', dept: 'PMO' },
  ];

  const userIds: string[] = [];
  for (const u of users) {
    const id = randomUUID();
    userIds.push(id);
    await pool.query(
      `INSERT INTO users (id, email, password, first_name, last_name, role, status, department, email_verified_at, login_count)
       VALUES ($1, $2, crypt('password123', gen_salt('bf', 10)), $3, $4, $5, 'active', $6, NOW(), $7)`,
      [id, u.email, u.first, u.last, u.role, u.dept, Math.floor(Math.random() * 50) + 1]
    );
  }
  console.log(`  ✅ ${users.length} users created`);

  // ============================================
  // PROJECTS
  // ============================================
  console.log('\n📁 Creating projects...');
  const projects = [
    { name: 'ERP Implementation - PT ABC', client: 'PT ABC Tbk', type: 'ERP Implementation', pmIdx: 1, budget: 500000000, contract: 750000000, status: 'development', health: 'green', start: '2026-01-15', end: '2026-12-31', progress: 45 },
    { name: 'Digital Transformation - PT XYZ', client: 'PT XYZ Indonesia', type: 'Digital Transformation', pmIdx: 2, budget: 300000000, contract: 450000000, status: 'analysis', health: 'yellow', start: '2026-03-01', end: '2026-09-30', progress: 20 },
    { name: 'E-Commerce Platform - PT DEF', client: 'PT DEF Retail', type: 'E-Commerce', pmIdx: 1, budget: 200000000, contract: 350000000, status: 'sit', health: 'green', start: '2026-02-01', end: '2026-08-31', progress: 65 },
    { name: 'PMO Setup - PT GHI', client: 'PT GHI Consulting', type: 'PMO Setup', pmIdx: 7, budget: 150000000, contract: 200000000, status: 'planning', health: 'green', start: '2026-06-01', end: '2026-10-31', progress: 5 },
  ];

  const projectIds: string[] = [];
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const id = randomUUID();
    projectIds.push(id);
    const code = 'PRJ-' + String(i + 1).padStart(4, '0');
    await pool.query(
      `INSERT INTO projects (id, code, name, description, client_name, project_type, status, health, contract_value, budget, start_date, end_date, completion_percentage, project_manager_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [id, code, p.name, `${p.type} project for ${p.client}`, p.client, p.type, p.status, p.health, p.contract, p.budget, p.start, p.end, p.progress, userIds[p.pmIdx], userIds[0]]
    );
  }
  console.log(`  ✅ ${projects.length} projects created`);

  // ============================================
  // PROJECT MEMBERS
  // ============================================
  console.log('\n👥 Adding project members...');
  await pool.query(
    `INSERT INTO project_members (project_id, user_id, role, allocation_percentage) VALUES
       ($1, $2, 'project_manager', 100), ($1, $3, 'team_lead', 100), ($1, $4, 'developer', 100),
       ($1, $5, 'developer', 80), ($1, $6, 'qa', 100),
       ($2, $7, 'project_manager', 100), ($2, $3, 'developer', 50), ($2, $6, 'qa', 50),
       ($3, $2, 'project_manager', 100), ($3, $4, 'developer', 100), ($3, $5, 'developer', 100),
       ($4, $8, 'pmo', 100), ($4, $7, 'project_manager', 50), ($4, $3, 'team_lead', 50)
     ON CONFLICT DO NOTHING`,
    [projectIds[0], projectIds[1], projectIds[2], projectIds[3], userIds[1], userIds[2], userIds[3], userIds[4], userIds[5], userIds[6], userIds[7]]
  );
  console.log('  ✅ Project members added');

  // ============================================
  // SPRINTS
  // ============================================
  console.log('\n🏃 Creating sprints...');
  const sprintIds: string[] = [];
  const sprintData = [
    { project: 0, name: 'Sprint 1 - Foundation', goal: 'Setup core architecture', status: 'completed', start: '2026-01-15', end: '2026-01-29' },
    { project: 0, name: 'Sprint 2 - Core Modules', goal: 'User management & auth', status: 'completed', start: '2026-01-30', end: '2026-02-13' },
    { project: 0, name: 'Sprint 3 - Inventory', goal: 'Inventory module', status: 'active', start: '2026-02-14', end: '2026-02-28' },
    { project: 0, name: 'Sprint 4 - Sales', goal: 'Sales & purchasing', status: 'planning', start: '2026-03-01', end: '2026-03-15' },
    { project: 2, name: 'Sprint 1 - UI/UX', goal: 'Design and frontend', status: 'active', start: '2026-02-01', end: '2026-02-15' },
  ];
  for (const s of sprintData) {
    const id = randomUUID();
    sprintIds.push(id);
    await pool.query(
      `INSERT INTO sprints (id, project_id, name, goal, status, start_date, end_date, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, projectIds[s.project], s.name, s.goal, s.status, s.start, s.end, userIds[1]]
    );
  }
  console.log(`  ✅ ${sprintData.length} sprints created`);

  // ============================================
  // TASKS
  // ============================================
  console.log('\n📋 Creating tasks...');
  const taskData = [
    { project: 0, sprint: 0, title: 'Setup Database Schema', status: 'done', priority: 'critical', assignee: 3, type: 'task', points: 8, hours: 16 },
    { project: 0, sprint: 0, title: 'Setup CI/CD Pipeline', status: 'done', priority: 'high', assignee: 4, type: 'task', points: 5, hours: 12 },
    { project: 0, sprint: 1, title: 'User Registration Module', status: 'done', priority: 'high', assignee: 3, type: 'story', points: 8, hours: 20 },
    { project: 0, sprint: 1, title: 'Login & Authentication', status: 'done', priority: 'critical', assignee: 4, type: 'story', points: 8, hours: 16 },
    { project: 0, sprint: 2, title: 'Inventory Module Config', status: 'in_progress', priority: 'high', assignee: 3, type: 'story', points: 13, hours: 32 },
    { project: 0, sprint: 2, title: 'API Documentation', status: 'review', priority: 'medium', assignee: 5, type: 'task', points: 5, hours: 10 },
    { project: 0, sprint: 2, title: 'Data Migration Script', status: 'todo', priority: 'high', assignee: 4, type: 'task', points: 8, hours: 24 },
    { project: 0, sprint: 3, title: 'Payment Gateway Integration', status: 'backlog', priority: 'medium', assignee: 4, type: 'story', points: 13, hours: 40 },
    { project: 1, sprint: null, title: 'Requirements Gathering', status: 'in_progress', priority: 'critical', assignee: 2, type: 'task', points: 8, hours: 16 },
    { project: 1, sprint: null, title: 'Stakeholder Interviews', status: 'done', priority: 'high', assignee: 7, type: 'task', points: 5, hours: 12 },
    { project: 2, sprint: 4, title: 'UI Design Review', status: 'in_progress', priority: 'high', assignee: 3, type: 'task', points: 5, hours: 16 },
    { project: 2, sprint: 4, title: 'Frontend Development', status: 'todo', priority: 'high', assignee: 4, type: 'story', points: 13, hours: 40 },
    { project: 3, sprint: null, title: 'PMO Framework Documentation', status: 'in_progress', priority: 'medium', assignee: 7, type: 'task', points: 8, hours: 20 },
    { project: 3, sprint: null, title: 'Process Mapping', status: 'todo', priority: 'high', assignee: 2, type: 'story', points: 13, hours: 32 },
  ];
  for (const t of taskData) {
    const id = randomUUID();
    const sprintId = t.sprint !== null ? sprintIds[t.sprint] : null;
    await pool.query(
      `INSERT INTO tasks (id, project_id, sprint_id, title, description, status, priority, task_type, assignee_id, reporter_id, story_points, estimated_hours, due_date, completion_percentage)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [id, projectIds[t.project], sprintId, t.title, `Task: ${t.title}`, t.status, t.priority, t.type, userIds[t.assignee], userIds[1], t.points, t.hours, '2026-07-15', t.status === 'done' ? 100 : t.status === 'in_progress' ? 50 : 0]
    );
  }
  console.log(`  ✅ ${taskData.length} tasks created`);

  // ============================================
  // ISSUES
  // ============================================
  console.log('\n🐛 Creating issues...');
  const issueData = [
    { project: 0, title: 'Database connection timeout under load', severity: 'critical', status: 'open', assignee: 3 },
    { project: 2, title: 'Payment gateway returns 500 error', severity: 'critical', status: 'investigation', assignee: 4 },
    { project: 1, title: 'Report export shows wrong date format', severity: 'minor', status: 'fixed', assignee: 5 },
    { project: 0, title: 'User session expires too quickly', severity: 'major', status: 'open', assignee: 3 },
    { project: 3, title: 'Dashboard loading slowly', severity: 'minor', status: 'closed', assignee: 5 },
  ];
  for (const iss of issueData) {
    await pool.query(
      `INSERT INTO issues (id, project_id, title, description, status, severity, assignee_id, reporter_id, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [randomUUID(), projectIds[iss.project], iss.title, `Issue: ${iss.title}`, iss.status, iss.severity, userIds[iss.assignee], userIds[1], '2026-07-30']
    );
  }
  console.log(`  ✅ ${issueData.length} issues created`);

  // ============================================
  // RISKS
  // ============================================
  console.log('\n⚠️ Creating risks...');
  const riskData = [
    { project: 0, title: 'Key developer may leave', prob: 3, impact: 5, level: 'high', status: 'identified' },
    { project: 1, title: 'Client requirements keep changing', prob: 4, impact: 4, level: 'high', status: 'assessed' },
    { project: 2, title: 'Third-party API deprecation', prob: 2, impact: 5, level: 'high', status: 'mitigated' },
    { project: 3, title: 'Budget overrun due to scope creep', prob: 3, impact: 4, level: 'medium', status: 'identified' },
  ];
  for (const r of riskData) {
    await pool.query(
      `INSERT INTO risks (id, project_id, title, description, probability, impact, risk_level, status, owner_id, mitigation_plan)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [randomUUID(), projectIds[r.project], r.title, `Risk: ${r.title}`, r.prob, r.impact, r.level, r.status, userIds[1], 'Mitigation plan']
    );
  }
  console.log(`  ✅ ${riskData.length} risks created`);

  // ============================================
  // TIMESHEETS
  // ============================================
  console.log('\n⏱️ Creating timesheets...');
  const tsData = [
    { user: 3, project: 0, date: '2026-06-20', hours: 8, status: 'approved', activity: 'Development' },
    { user: 4, project: 0, date: '2026-06-20', hours: 6, status: 'approved', activity: 'Development' },
    { user: 5, project: 2, date: '2026-06-21', hours: 4, status: 'submitted', activity: 'Review' },
    { user: 3, project: 0, date: '2026-06-21', hours: 3, status: 'draft', activity: 'Testing' },
    { user: 6, project: 2, date: '2026-06-22', hours: 5, status: 'approved', activity: 'QA Testing' },
  ];
  for (const ts of tsData) {
    await pool.query(
      `INSERT INTO timesheets (id, user_id, project_id, date, hours, description, activity_type, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [randomUUID(), userIds[ts.user], projectIds[ts.project], ts.date, ts.hours, `${ts.activity} work`, ts.activity, ts.status]
    );
  }
  console.log(`  ✅ ${tsData.length} timesheet entries created`);

  // ============================================
  // MEETINGS
  // ============================================
  console.log('\n📅 Creating meetings...');
  const meetingData = [
    { project: 0, title: 'Sprint Planning - ERP', type: 'sprint_planning', start: '2026-06-20T09:00:00+07:00', end: '2026-06-20T11:00:00+07:00', organizer: 1 },
    { project: 2, title: 'UAT Review - E-Commerce', type: 'review', start: '2026-06-22T14:00:00+07:00', end: '2026-06-22T16:00:00+07:00', organizer: 1 },
    { project: 1, title: 'Stakeholder Update', type: 'stakeholder', start: '2026-06-25T10:00:00+07:00', end: '2026-06-25T11:00:00+07:00', organizer: 2 },
  ];
  for (const m of meetingData) {
    await pool.query(
      `INSERT INTO meetings (id, project_id, title, meeting_type, start_time, end_time, organizer_id, status) VALUES ($1,$2,$3,$4,$5,$6,$7,'scheduled')`,
      [randomUUID(), projectIds[m.project], m.title, m.type, m.start, m.end, userIds[m.organizer]]
    );
  }
  console.log(`  ✅ ${meetingData.length} meetings created`);

  // ============================================
  // NOTIFICATIONS + AUDIT + BUDGET
  // ============================================
  console.log('\n🔔 Creating notifications...');
  for (let i = 1; i < userIds.length; i++) {
    await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, message, reference_type, is_read) VALUES ($1,$2,'system','Welcome','Welcome to ProjectFlow!','system',$3)`,
      [randomUUID(), userIds[i], i % 2 === 0]
    );
  }

  console.log('💰 Creating budget entries...');
  const budgetData = [
    { project: 0, cat: 'Development', desc: 'Sprint 1-2 Dev', planned: 100000000, actual: 95000000, type: 'expense', date: '2026-02-28' },
    { project: 0, cat: 'Infrastructure', desc: 'Server setup', planned: 50000000, actual: 48000000, type: 'expense', date: '2026-01-31' },
    { project: 0, cat: 'Revenue', desc: 'Phase 1 Payment', planned: 200000000, actual: 200000000, type: 'income', date: '2026-03-15' },
    { project: 1, cat: 'Consulting', desc: 'Business analysis', planned: 80000000, actual: 60000000, type: 'expense', date: '2026-04-30' },
  ];
  for (const b of budgetData) {
    await pool.query(
      `INSERT INTO budget_entries (id, project_id, category, description, planned_amount, actual_amount, date, entry_type, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [randomUUID(), projectIds[b.project], b.cat, b.desc, b.planned, b.actual, b.date, b.type, userIds[1]]
    );
  }

  console.log('\n🎉 Seed completed!');
  console.log('\n📊 Summary:');
  console.log('  - 9 users (1 admin + 8 team)');
  console.log('  - 4 projects, 14 project members, 5 sprints');
  console.log('  - 14 tasks, 5 issues, 4 risks');
  console.log('  - 5 timesheets, 3 meetings');
  console.log('  - 8 notifications, 4 budget entries');
  console.log('\n🔑 Login: admin@projectflow.com / admin123');

  await pool.end();
}

seed().catch(console.error);
