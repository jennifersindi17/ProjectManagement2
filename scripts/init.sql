-- ============================================
-- ProjectFlow 2.0 — Database Schema
-- Enterprise Project Management System
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('super_admin', 'director', 'pmo', 'project_manager', 'team_lead', 'developer', 'qa', 'client');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE project_status AS ENUM ('planning', 'analysis', 'development', 'sit', 'uat', 'go_live', 'support', 'closed', 'on_hold', 'cancelled');
CREATE TYPE project_priority AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE project_health AS ENUM ('green', 'yellow', 'red');
CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked', 'cancelled');
CREATE TYPE task_priority AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE task_type AS ENUM ('feature', 'bug', 'improvement', 'task', 'epic', 'story', 'subtask');
CREATE TYPE sprint_status AS ENUM ('planning', 'active', 'completed', 'cancelled');
CREATE TYPE issue_status AS ENUM ('open', 'in_progress', 'investigation', 'fixed', 'closed', 'reopened');
CREATE TYPE issue_severity AS ENUM ('critical', 'major', 'minor', 'trivial');
CREATE TYPE risk_status AS ENUM ('identified', 'assessed', 'mitigated', 'monitoring', 'closed', 'occurred');
CREATE TYPE risk_level AS ENUM ('very_low', 'low', 'medium', 'high', 'very_high');
CREATE TYPE document_status AS ENUM ('draft', 'review', 'approved', 'archived');
CREATE TYPE document_category AS ENUM ('contract', 'brd', 'fsd', 'sit', 'uat', 'mom', 'training_material', 'report', 'other');
CREATE TYPE change_request_status AS ENUM ('draft', 'review', 'approved', 'rejected', 'in_development', 'testing', 'deployed', 'closed');
CREATE TYPE timesheet_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
CREATE TYPE notification_type AS ENUM ('task_assigned', 'task_updated', 'comment_added', 'mention', 'project_update', 'risk_alert', 'deadline_reminder', 'approval_request', 'system');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'export', 'import', 'approve', 'reject', 'assign', 'status_change');

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    role user_role NOT NULL DEFAULT 'developer',
    status user_status NOT NULL DEFAULT 'pending',
    department VARCHAR(100),
    position VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
    language VARCHAR(10) DEFAULT 'id',
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_department ON users(department);

-- ============================================
-- REFRESH TOKENS
-- ============================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255),
    client_contact VARCHAR(255),
    project_type VARCHAR(100),
    status project_status NOT NULL DEFAULT 'planning',
    priority project_priority NOT NULL DEFAULT 'medium',
    health project_health NOT NULL DEFAULT 'green',
    contract_value DECIMAL(15, 2) DEFAULT 0,
    budget DECIMAL(15, 2) DEFAULT 0,
    actual_cost DECIMAL(15, 2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    completion_percentage DECIMAL(5, 2) DEFAULT 0,
    project_manager_id UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    cover_image_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_code ON projects(code);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_project_manager ON projects(project_manager_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at);

-- ============================================
-- PROJECT MEMBERS
-- ============================================
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    allocation_percentage DECIMAL(5, 2) DEFAULT 100,
    hourly_rate DECIMAL(10, 2),
    UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);

-- ============================================
-- SPRINTS TABLE
-- ============================================
CREATE TABLE sprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    goal TEXT,
    status sprint_status NOT NULL DEFAULT 'planning',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_story_points DECIMAL(8, 2) DEFAULT 0,
    completed_story_points DECIMAL(8, 2) DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sprints_project ON sprints(project_id);
CREATE INDEX idx_sprints_status ON sprints(status);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    task_code VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'backlog',
    priority task_priority NOT NULL DEFAULT 'medium',
    task_type task_type NOT NULL DEFAULT 'task',
    assignee_id UUID REFERENCES users(id),
    reporter_id UUID NOT NULL REFERENCES users(id),
    story_points DECIMAL(5, 2),
    estimated_hours DECIMAL(8, 2),
    actual_hours DECIMAL(8, 2) DEFAULT 0,
    due_date DATE,
    start_date DATE,
    completed_at TIMESTAMPTZ,
    completion_percentage DECIMAL(5, 2) DEFAULT 0,
    position INTEGER DEFAULT 0,
    labels TEXT[] DEFAULT '{}',
    attachments_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(project_id, task_code)
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_sprint ON tasks(sprint_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_reporter ON tasks(reporter_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at);
CREATE INDEX idx_tasks_labels ON tasks USING GIN(labels);

-- ============================================
-- TASK COMMENTS
-- ============================================
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_task_comments_task ON task_comments(task_id);
CREATE INDEX idx_task_comments_user ON task_comments(user_id);

-- ============================================
-- TASK ACTIVITY LOG
-- ============================================
CREATE TABLE task_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    field_changed VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_activities_task ON task_activities(task_id);
CREATE INDEX idx_task_activities_created ON task_activities(created_at);

-- ============================================
-- TIMESHEETS TABLE
-- ============================================
CREATE TABLE timesheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    hours DECIMAL(5, 2) NOT NULL,
    description TEXT,
    activity_type VARCHAR(100),
    status timesheet_status NOT NULL DEFAULT 'draft',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timesheets_user ON timesheets(user_id);
CREATE INDEX idx_timesheets_project ON timesheets(project_id);
CREATE INDEX idx_timesheets_date ON timesheets(date);
CREATE INDEX idx_timesheets_status ON timesheets(status);
CREATE INDEX idx_timesheets_user_date ON timesheets(user_id, date);

-- ============================================
-- ISSUES TABLE
-- ============================================
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    issue_code VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status issue_status NOT NULL DEFAULT 'open',
    severity issue_severity NOT NULL DEFAULT 'minor',
    category VARCHAR(50),
    assignee_id UUID REFERENCES users(id),
    reporter_id UUID NOT NULL REFERENCES users(id),
    resolution TEXT,
    due_date DATE,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, issue_code)
);

CREATE INDEX idx_issues_project ON issues(project_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_severity ON issues(severity);
CREATE INDEX idx_issues_assignee ON issues(assignee_id);

-- ============================================
-- RISKS TABLE
-- ============================================
CREATE TABLE risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    risk_code VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    probability INTEGER CHECK (probability >= 1 AND probability <= 5),
    impact INTEGER CHECK (impact >= 1 AND impact <= 5),
    risk_score INTEGER GENERATED ALWAYS AS (probability * impact) STORED,
    risk_level risk_level NOT NULL DEFAULT 'medium',
    status risk_status NOT NULL DEFAULT 'identified',
    category VARCHAR(100),
    mitigation_plan TEXT,
    contingency_plan TEXT,
    owner_id UUID REFERENCES users(id),
    identified_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_date DATE,
    closed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, risk_code)
);

CREATE INDEX idx_risks_project ON risks(project_id);
CREATE INDEX idx_risks_status ON risks(status);
CREATE INDEX idx_risks_score ON risks(risk_score DESC);
CREATE INDEX idx_risks_level ON risks(risk_level);

-- ============================================
-- CHANGE REQUESTS TABLE
-- ============================================
CREATE TABLE change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    cr_code VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    justification TEXT,
    impact_analysis TEXT,
    status change_request_status NOT NULL DEFAULT 'draft',
    requested_by UUID NOT NULL REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    rejected_reason TEXT,
    priority project_priority NOT NULL DEFAULT 'medium',
    estimated_cost DECIMAL(15, 2) DEFAULT 0,
    target_date DATE,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, cr_code)
);

CREATE INDEX idx_change_requests_project ON change_requests(project_id);
CREATE INDEX idx_change_requests_status ON change_requests(status);
CREATE INDEX idx_change_requests_requested_by ON change_requests(requested_by);

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category document_category NOT NULL DEFAULT 'other',
    status document_status NOT NULL DEFAULT 'draft',
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    version VARCHAR(20) DEFAULT '1.0',
    uploaded_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);

-- ============================================
-- MEETINGS TABLE
-- ============================================
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_type VARCHAR(50) NOT NULL DEFAULT 'general',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    location VARCHAR(255),
    meeting_link VARCHAR(500),
    organizer_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    minutes TEXT,
    action_items JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meetings_project ON meetings(project_id);
CREATE INDEX idx_meetings_start_time ON meetings(start_time);
CREATE INDEX idx_meetings_organizer ON meetings(organizer_id);

-- ============================================
-- MEETING PARTICIPANTS
-- ============================================
CREATE TABLE meeting_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'invited',
    attended BOOLEAN DEFAULT false,
    UNIQUE(meeting_id, user_id)
);

CREATE INDEX idx_meeting_participants_meeting ON meeting_participants(meeting_id);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action audit_action NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- ACTIVITY LOG TABLE
-- ============================================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    action VARCHAR(100) NOT NULL,
    description TEXT,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_project ON activity_logs(project_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

-- ============================================
-- BUDGET ENTRIES TABLE
-- ============================================
CREATE TABLE budget_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    planned_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    actual_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('income', 'expense')),
    created_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_budget_entries_project ON budget_entries(project_id);
CREATE INDEX idx_budget_entries_date ON budget_entries(date);
CREATE INDEX idx_budget_entries_type ON budget_entries(entry_type);

-- ============================================
-- USER SESSIONS TABLE
-- ============================================
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- ============================================
-- DATABASE MIGRATION TRACKING
-- ============================================
CREATE TABLE schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checksum VARCHAR(64),
    execution_time_ms INTEGER
);

INSERT INTO schema_migrations (version, name) VALUES ('001', 'initial_schema');

-- ============================================
-- TRIGGERS: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON sprints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risks_updated_at BEFORE UPDATE ON risks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_change_requests_updated_at BEFORE UPDATE ON change_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON timesheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_entries_updated_at BEFORE UPDATE ON budget_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGERS: Auto-increment task_code per project
-- ============================================
CREATE OR REPLACE FUNCTION generate_task_code()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    project_code VARCHAR(20);
BEGIN
    SELECT code INTO project_code FROM projects WHERE id = NEW.project_id;
    SELECT COALESCE(MAX(CAST(SUBSTRING(task_code FROM LENGTH(project_code) + 2) AS INTEGER)), 0) + 1
    INTO next_num
    FROM tasks
    WHERE project_id = NEW.project_id AND task_code LIKE project_code || '-%';
    
    NEW.task_code := project_code || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_generate_task_code
    BEFORE INSERT ON tasks
    FOR EACH ROW
    WHEN (NEW.task_code IS NULL OR NEW.task_code = '')
    EXECUTE FUNCTION generate_task_code();

-- ============================================
-- TRIGGERS: Auto-increment issue_code per project
-- ============================================
CREATE OR REPLACE FUNCTION generate_issue_code()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(issue_code FROM 5) AS INTEGER)), 0) + 1
    INTO next_num
    FROM issues
    WHERE project_id = NEW.project_id AND issue_code LIKE 'ISS-%';
    
    NEW.issue_code := 'ISS-' || TO_CHAR(next_num, 'FM0000');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_generate_issue_code
    BEFORE INSERT ON issues
    FOR EACH ROW
    WHEN (NEW.issue_code IS NULL OR NEW.issue_code = '')
    EXECUTE FUNCTION generate_issue_code();

-- ============================================
-- TRIGGERS: Auto-increment risk_code per project
-- ============================================
CREATE OR REPLACE FUNCTION generate_risk_code()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(risk_code FROM 5) AS INTEGER)), 0) + 1
    INTO next_num
    FROM risks
    WHERE project_id = NEW.project_id AND risk_code LIKE 'RSK-%';
    
    NEW.risk_code := 'RSK-' || TO_CHAR(next_num, 'FM0000');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_generate_risk_code
    BEFORE INSERT ON risks
    FOR EACH ROW
    WHEN (NEW.risk_code IS NULL OR NEW.risk_code = '')
    EXECUTE FUNCTION generate_risk_code();

-- ============================================
-- TRIGGERS: Auto-increment cr_code per project
-- ============================================
CREATE OR REPLACE FUNCTION generate_cr_code()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(cr_code FROM 4) AS INTEGER)), 0) + 1
    INTO next_num
    FROM change_requests
    WHERE project_id = NEW.project_id AND cr_code LIKE 'CR-%';
    
    NEW.cr_code := 'CR-' || TO_CHAR(next_num, 'FM0000');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_generate_cr_code
    BEFORE INSERT ON change_requests
    FOR EACH ROW
    WHEN (NEW.cr_code IS NULL OR NEW.cr_code = '')
    EXECUTE FUNCTION generate_cr_code();

-- ============================================
-- TRIGGERS: Update project completion percentage
-- ============================================
CREATE OR REPLACE FUNCTION update_project_completion()
RETURNS TRIGGER AS $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
    new_percentage DECIMAL(5, 2);
BEGIN
    SELECT COUNT(*) INTO total_tasks
    FROM tasks
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id) AND deleted_at IS NULL;
    
    SELECT COUNT(*) INTO completed_tasks
    FROM tasks
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    AND status = 'done' AND deleted_at IS NULL;
    
    IF total_tasks > 0 THEN
        new_percentage := (completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100;
    ELSE
        new_percentage := 0;
    END IF;
    
    UPDATE projects SET completion_percentage = new_percentage
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_project_completion
    AFTER INSERT OR UPDATE OF status ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_project_completion();

-- ============================================
-- INITIAL DATA: Default admin user
-- Password: admin123 (bcrypt hashed)
-- ============================================
INSERT INTO users (email, password, first_name, last_name, role, status, department, email_verified_at)
VALUES (
    'admin@projectflow.com',
    crypt('admin123', gen_salt('bf', 10)),
    'Admin',
    'User',
    'super_admin',
    'active',
    'IT',
    NOW()
);

-- ============================================
-- PERMISSIONS HELPER VIEW
-- ============================================
CREATE VIEW user_permissions AS
SELECT
    u.id AS user_id,
    u.email,
    u.role,
    CASE u.role
        WHEN 'super_admin' THEN ARRAY['*']
        WHEN 'director' THEN ARRAY['projects:read','projects:write','reports:read','dashboard:read','settings:read']
        WHEN 'pmo' THEN ARRAY['projects:read','projects:write','tasks:read','tasks:write','reports:read','dashboard:read']
        WHEN 'project_manager' THEN ARRAY['projects:read','projects:write','tasks:read','tasks:write','sprints:read','sprints:write','dashboard:read']
        WHEN 'team_lead' THEN ARRAY['projects:read','tasks:read','tasks:write','sprints:read','dashboard:read']
        WHEN 'developer' THEN ARRAY['projects:read','tasks:read','tasks:write:own','dashboard:read']
        WHEN 'qa' THEN ARRAY['projects:read','tasks:read','tasks:write:own','issues:read','issues:write','dashboard:read']
        WHEN 'client' THEN ARRAY['projects:read:own','tasks:read:own','documents:read','dashboard:read:own']
    END AS permissions
FROM users u
WHERE u.status = 'active' AND u.deleted_at IS NULL;

-- ============================================
-- PROJECT DASHBOARD VIEW
-- ============================================
CREATE VIEW project_dashboard AS
SELECT
    p.id,
    p.code,
    p.name,
    p.client_name,
    p.status,
    p.health,
    p.completion_percentage,
    p.contract_value,
    p.budget,
    p.actual_cost,
    p.start_date,
    p.end_date,
    pm.first_name || ' ' || pm.last_name AS project_manager_name,
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.deleted_at IS NULL) AS total_tasks,
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done' AND t.deleted_at IS NULL) AS completed_tasks,
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'in_progress' AND t.deleted_at IS NULL) AS in_progress_tasks,
    (SELECT COUNT(*) FROM issues i WHERE i.project_id = p.id AND i.status NOT IN ('closed', 'fixed')) AS open_issues,
    (SELECT COUNT(*) FROM risks r WHERE r.project_id = p.id AND r.status NOT IN ('closed', 'occurred')) AS open_risks,
    (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) AS team_size
FROM projects p
LEFT JOIN users pm ON p.project_manager_id = pm.id
WHERE p.deleted_at IS NULL;
