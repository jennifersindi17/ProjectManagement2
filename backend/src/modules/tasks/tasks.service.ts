import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(@InjectRepository(Task) private repo: Repository<Task>) {}

  // === Existing CRUD ===
  async findAll(
    page = 1, limit = 20, projectId?: string, sprintId?: string,
    status?: string, priority?: string, assigneeId?: string, search?: string,
    dueDateFrom?: string, dueDateTo?: string, label?: string,
    sort?: string, order?: string,
  ) {
    // Use raw SQL for joins since entity doesn't have relations
    let where = 'WHERE t.deleted_at IS NULL';
    const params: any[] = [];
    let paramIdx = 1;

    if (projectId) { where += ` AND t.project_id = $${paramIdx++}`; params.push(projectId); }
    if (sprintId) { where += ` AND t.sprint_id = $${paramIdx++}`; params.push(sprintId); }
    if (status) { where += ` AND t.status = $${paramIdx++}`; params.push(status); }
    if (priority) { where += ` AND t.priority = $${paramIdx++}`; params.push(priority); }
    if (assigneeId) { where += ` AND t.assignee_id = $${paramIdx++}`; params.push(assigneeId); }
    if (search) { where += ` AND (t.title ILIKE $${paramIdx} OR t.task_code ILIKE $${paramIdx})`; params.push(`%${search}%`); paramIdx++; }
    if (dueDateFrom) { where += ` AND t.due_date >= $${paramIdx++}`; params.push(dueDateFrom); }
    if (dueDateTo) { where += ` AND t.due_date <= $${paramIdx++}`; params.push(dueDateTo); }
    if (label) { where += ` AND $${paramIdx} = ANY(t.labels)`; params.push(label); paramIdx++; }

    const allowedSorts: Record<string, string> = {
      title: 't.title', dueDate: 't.due_date', startDate: 't.start_date',
      priority: 't.priority', status: 't.status', createdAt: 't.created_at', position: 't.position',
    };
    const sortCol = allowedSorts[sort] || 't.position';
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

    const countResult = await this.repo.query(`SELECT COUNT(*) as cnt FROM tasks t ${where}`, params);
    const total = parseInt(countResult[0].cnt);

    const offset = (page - 1) * limit;
    const data = await this.repo.query(
      `SELECT t.*,
              p.name as project_name, p.code as project_code,
              u.first_name as assignee_first_name, u.last_name as assignee_last_name, u.avatar_url as assignee_avatar
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assignee_id = u.id
       ${where}
       ORDER BY ${sortCol} ${sortOrder}, t.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset],
    );

    return {
      data: data.map(this.mapRow),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private mapRow(row: any) {
    const task: any = {};
    // These are already in camelCase from raw SQL aliases or need mapping
    const directCopy = ['id', 'title', 'description', 'status', 'priority', 'taskType', 'taskCode',
      'storyPoints', 'estimatedHours', 'actualHours', 'completionPercentage', 'position',
      'labels', 'metadata', 'createdAt', 'updatedAt', 'deletedAt', 'dueDate', 'startDate', 'completedAt'];
    const snakeToCamel = ['project_id', 'sprint_id', 'parent_task_id', 'assignee_id', 'reporter_id'];

    for (const key of Object.keys(row)) {
      if (key === 'project_name') { task.projectName = row[key]; continue; }
      if (key === 'project_code') { task.projectCode = row[key]; continue; }
      if (key === 'assignee_first_name') {
        task.assignee = row[key] ? { firstName: row[key], lastName: row.assignee_last_name, avatar: row.assignee_avatar } : null;
        continue;
      }
      if (key === 'assignee_last_name' || key === 'assignee_avatar') continue;

      if (directCopy.includes(key)) { task[key] = row[key]; continue; }
      if (snakeToCamel.includes(key)) {
        const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        task[camelKey] = row[key];
        continue;
      }
      // For any other snake_case columns, convert
      if (row[key] !== undefined && row[key] !== null) {
        const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        task[camelKey] = row[key];
      }
    }
    return task;
  }

  async findOne(id: string) {
    const task = await this.repo.findOne({ where: { id, deletedAt: null } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(dto: CreateTaskDto, userId: string) {
    const count = await this.repo.count({ where: { projectId: dto.projectId } });
    const project = await this.repo.query('SELECT code FROM projects WHERE id = $1', [dto.projectId]);
    const code = project.length > 0
      ? `${project[0].code}-${String(count + 1).padStart(4, '0')}`
      : `TSK-${String(count + 1).padStart(4, '0')}`;
    const task = this.repo.create({ ...dto, taskCode: code, reporterId: userId });
    return this.repo.save(task);
  }

  async update(id: string, dto: UpdateTaskDto, userId?: string) {
    const existing = await this.findOne(id);
    const updateData: any = {};

    // Only include fields that were actually provided
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === 'done') updateData.completedAt = new Date();
    }
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.taskType !== undefined) updateData.taskType = dto.taskType;
    if (dto.assigneeId !== undefined) updateData.assigneeId = dto.assigneeId;
    if (dto.storyPoints !== undefined) updateData.storyPoints = dto.storyPoints;
    if (dto.estimatedHours !== undefined) updateData.estimatedHours = dto.estimatedHours;
    if (dto.actualHours !== undefined) updateData.actualHours = dto.actualHours;
    if (dto.dueDate !== undefined) updateData.dueDate = dto.dueDate;
    if (dto.startDate !== undefined) updateData.startDate = dto.startDate;
    if (dto.completionPercentage !== undefined) updateData.completionPercentage = dto.completionPercentage;
    if (dto.labels !== undefined) updateData.labels = dto.labels;
    if (dto.parentTaskId !== undefined) updateData.parentTaskId = dto.parentTaskId;
    if (dto.dependsOn !== undefined) updateData.dependsOn = dto.dependsOn;
    if (dto.sprintId !== undefined) updateData.sprintId = dto.sprintId;

    await this.repo.update(id, updateData);

    // Log activity if userId provided
    if (userId) {
      const changes = this.buildChangeLog(existing, dto);
      if (changes.length > 0) {
        await this.repo.query(
          `INSERT INTO audit_logs (entity_type, entity_id, action, details, user_id, created_at)
           VALUES ('task', $1, 'task_updated', $2, $3, NOW())`,
          [id, JSON.stringify({ changes }), userId],
        );
      }
    }

    return this.findOne(id);
  }

  private buildChangeLog(existing: any, dto: UpdateTaskDto): { field: string; from: any; to: any }[] {
    const changes: { field: string; from: any; to: any }[] = [];
    const fieldLabels: Record<string, string> = {
      title: 'Task Name', description: 'Description', status: 'Status',
      priority: 'Priority', taskType: 'Task Type', assigneeId: 'Assignee',
      storyPoints: 'Story Points', estimatedHours: 'Estimated Hours',
      actualHours: 'Actual Hours', dueDate: 'Due Date', startDate: 'Start Date',
      completionPercentage: 'Progress', labels: 'Labels', parentTaskId: 'Parent Task',
      dependsOn: 'Dependencies', sprintId: 'Sprint',
    };

    for (const [field, label] of Object.entries(fieldLabels)) {
      const oldVal = (existing as any)[field];
      const newVal = (dto as any)[field];
      if (newVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({ field: label, from: oldVal ?? '-', to: newVal ?? '-' });
      }
    }
    return changes;
  }

  async remove(id: string) {
    await this.repo.update(id, { deletedAt: new Date() });
    return { message: 'Task deleted' };
  }

  // === Task Center Stats ===
  async getTaskCenterStats(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    const total = await this.repo.count({ where: { deletedAt: null } });
    const myTasks = await this.repo.count({ where: { assigneeId: userId, deletedAt: null } });

    const overdue = await this.repo.query(
      `SELECT COUNT(*) as cnt FROM tasks WHERE deleted_at IS NULL AND assignee_id = $1 AND due_date < $2 AND status NOT IN ('done', 'cancelled')`,
      [userId, today],
    );

    const dueToday = await this.repo.query(
      `SELECT COUNT(*) as cnt FROM tasks WHERE deleted_at IS NULL AND assignee_id = $1 AND due_date = $2 AND status NOT IN ('done', 'cancelled')`,
      [userId, today],
    );

    const inProgress = await this.repo.query(
      `SELECT COUNT(*) as cnt FROM tasks WHERE deleted_at IS NULL AND assignee_id = $1 AND status = 'in_progress'`,
      [userId],
    );

    const completed = await this.repo.query(
      `SELECT COUNT(*) as cnt FROM tasks WHERE deleted_at IS NULL AND assignee_id = $1 AND status = 'done'`,
      [userId],
    );

    const priorityBreakdown = await this.repo.query(
      `SELECT priority, COUNT(*) as count FROM tasks WHERE deleted_at IS NULL AND assignee_id = $1 GROUP BY priority`,
      [userId],
    );

    const statusBreakdown = await this.repo.query(
      `SELECT status, COUNT(*) as count FROM tasks WHERE deleted_at IS NULL AND assignee_id = $1 GROUP BY status`,
      [userId],
    );

    return {
      total, myTasks,
      overdue: parseInt(overdue[0]?.cnt || 0),
      dueToday: parseInt(dueToday[0]?.cnt || 0),
      inProgress: parseInt(inProgress[0]?.cnt || 0),
      completed: parseInt(completed[0]?.cnt || 0),
      priorityBreakdown, statusBreakdown,
    };
  }

  // === Kanban Data ===
  async getKanbanData(projectId?: string, userId?: string) {
    let where = 'WHERE t.deleted_at IS NULL';
    const params: any[] = [];
    let idx = 1;

    if (projectId) { where += ` AND t.project_id = $${idx++}`; params.push(projectId); }
    if (userId) { where += ` AND (t.assignee_id = $${idx} OR t.reporter_id = $${idx})`; params.push(userId); idx++; }

    const tasks = await this.repo.query(
      `SELECT t.id, t.title, t.status, t.priority, t.position, t.due_date, t.labels, t.completion_percentage,
              p.name as project_name, p.code as project_code,
              u.first_name as assignee_first_name, u.last_name as assignee_last_name, u.avatar_url as assignee_avatar
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assignee_id = u.id
       ${where}
       ORDER BY t.position ASC, t.created_at DESC`,
      params,
    );

    const columns: Record<string, any[]> = {
      backlog: [], todo: [], in_progress: [], review: [], testing: [], done: [], blocked: [], cancelled: [],
    };

    for (const row of tasks) {
      const task = this.mapRow(row);
      if (columns[task.status]) {
        columns[task.status].push(task);
      }
    }

    return { columns, total: tasks.length };
  }

  // === Calendar Data ===
  async getCalendarData(start: string, end: string, projectId?: string, userId?: string) {
    let where = "WHERE t.deleted_at IS NULL AND (t.due_date BETWEEN $1 AND $2 OR t.start_date BETWEEN $1 AND $2)";
    const params: any[] = [start, end];
    let idx = 3;

    if (projectId) { where += ` AND t.project_id = $${idx++}`; params.push(projectId); }
    if (userId) { where += ` AND (t.assignee_id = $${idx} OR t.reporter_id = $${idx})`; params.push(userId); idx++; }

    const tasks = await this.repo.query(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date, t.start_date,
              p.name as project_name, p.code as project_code,
              u.first_name as assignee_first_name, u.last_name as assignee_last_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assignee_id = u.id
       ${where}
       ORDER BY t.due_date ASC`,
      params,
    );

    return tasks.map(this.mapRow);
  }

  // === My Tasks Grouped ===
  async getMyTasks(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const assigned = await this.repo.query(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date, t.start_date, t.completion_percentage,
              p.name as project_name, p.code as project_code,
              u.first_name as assignee_first_name, u.last_name as assignee_last_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.deleted_at IS NULL AND t.assignee_id = $1 AND t.status NOT IN ('done', 'cancelled')
       ORDER BY t.due_date ASC`,
      [userId],
    );

    const dueToday = await this.repo.query(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date,
              p.name as project_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.deleted_at IS NULL AND t.assignee_id = $1 AND t.due_date = $2 AND t.status NOT IN ('done', 'cancelled')`,
      [userId, today],
    );

    const upcoming = await this.repo.query(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date,
              p.name as project_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.deleted_at IS NULL AND t.assignee_id = $1 AND t.due_date > $2 AND t.due_date <= $3 AND t.status NOT IN ('done', 'cancelled')
       ORDER BY t.due_date ASC`,
      [userId, today, nextWeek],
    );

    const overdue = await this.repo.query(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date,
              p.name as project_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.deleted_at IS NULL AND t.assignee_id = $1 AND t.due_date < $2 AND t.status NOT IN ('done', 'cancelled')`,
      [userId, today],
    );

    const completed = await this.repo.query(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date, t.completed_at,
              p.name as project_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.deleted_at IS NULL AND t.assignee_id = $1 AND t.status = 'done'
       ORDER BY t.completed_at DESC
       LIMIT 20`,
      [userId],
    );

    return {
      assigned: assigned.map(this.mapRow),
      dueToday: dueToday.map(this.mapRow),
      upcoming: upcoming.map(this.mapRow),
      overdue: overdue.map(this.mapRow),
      completed: completed.map(this.mapRow),
    };
  }

  // === Tags ===
  async getTags(projectId?: string) {
    let where = "WHERE deleted_at IS NULL AND labels IS NOT NULL AND array_length(labels, 1) > 0";
    const params: any[] = [];
    if (projectId) { where += " AND project_id = $1"; params.push(projectId); }
    const result = await this.repo.query(
      `SELECT DISTINCT UNNEST(labels) as tag FROM tasks ${where}`,
      params,
    );
    return result.map((r: any) => r.tag).filter(Boolean);
  }

  // === Reassignable Users ===
  async getReassignableUsers(userId: string) {
    return this.repo.query(
      `SELECT id, first_name, last_name, email, avatar_url, role
       FROM users WHERE deleted_at IS NULL AND id != $1
       ORDER BY first_name ASC`,
      [userId],
    );
  }

  // === Bulk Actions ===
  async bulkUpdateStatus(taskIds: string[], status: string) {
    if (taskIds.length === 0) return { updated: 0 };
    const setClause = status === 'done' ? 'status = $1, completed_at = NOW()' : 'status = $1';
    await this.repo.query(
      `UPDATE tasks SET ${setClause} WHERE id = ANY($2)`,
      [status, taskIds],
    );
    return { updated: taskIds.length };
  }

  async bulkAssign(taskIds: string[], assigneeId: string) {
    if (taskIds.length === 0) return { updated: 0 };
    await this.repo.query(
      `UPDATE tasks SET assignee_id = $1 WHERE id = ANY($2)`,
      [assigneeId, taskIds],
    );
    return { updated: taskIds.length };
  }

  async bulkDelete(taskIds: string[]) {
    if (taskIds.length === 0) return { deleted: 0 };
    await this.repo.query(
      `UPDATE tasks SET deleted_at = NOW() WHERE id = ANY($1)`,
      [taskIds],
    );
    return { deleted: taskIds.length };
  }

  // === Task Detail Extras ===
  async getComments(taskId: string) {
    return this.repo.query(
      `SELECT c.id, c.content, c.created_at,
              u.first_name, u.last_name, u.avatar_url
       FROM task_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1 AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC`,
      [taskId],
    );
  }

  async addComment(taskId: string, content: string, userId: string) {
    const result = await this.repo.query(
      `INSERT INTO task_comments (task_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, created_at`,
      [taskId, userId, content],
    );
    return result[0];
  }

  async getChecklist(taskId: string) {
    return this.repo.query(
      `SELECT id, title, completed, position, created_at
       FROM task_checklist_items
       WHERE task_id = $1 AND deleted_at IS NULL
       ORDER BY position ASC`,
      [taskId],
    );
  }

  async addChecklistItem(taskId: string, title: string, userId: string) {
    const count = await this.repo.query(
      `SELECT COUNT(*) as cnt FROM task_checklist_items WHERE task_id = $1 AND deleted_at IS NULL`,
      [taskId],
    );
    const result = await this.repo.query(
      `INSERT INTO task_checklist_items (task_id, title, position)
       VALUES ($1, $2, $3)
       RETURNING id, title, completed, position`,
      [taskId, title, parseInt(count[0].cnt) || 0],
    );
    return result[0];
  }

  async toggleChecklistItem(taskId: string, itemId: string, completed: boolean) {
    await this.repo.query(
      `UPDATE task_checklist_items SET completed = $1 WHERE id = $2 AND task_id = $3`,
      [completed, itemId, taskId],
    );
    return { id: itemId, completed };
  }

  async getActivityLog(taskId: string) {
    return this.repo.query(
      `SELECT a.id, a.action, a.details, a.created_at,
              u.first_name, u.last_name
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.entity_type = 'task' AND a.entity_id = $1
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [taskId],
    );
  }

  async reassign(taskId: string, assigneeId: string, userId: string) {
    await this.repo.update(taskId, { assigneeId });
    return this.findOne(taskId);
  }

  // === Gantt Chart Data ===
  async getGanttData(projectId?: string) {
    let where = 'WHERE t.deleted_at IS NULL';
    const params: any[] = [];
    if (projectId) {
      params.push(projectId);
      where += ` AND t.project_id = $${params.length}`;
    }

    const result = await this.repo.query(
      `SELECT
        t.id, t.task_code, t.title, t.description, t.status, t.priority, t.task_type,
        t.project_id, p.name AS project_name, p.code AS project_code,
        p.completion_percentage AS project_completion,
        t.assignee_id, a.first_name AS assignee_first_name, a.last_name AS assignee_last_name,
        a.avatar_url AS assignee_avatar,
        t.reporter_id, r.first_name AS reporter_first_name, r.last_name AS reporter_last_name,
        t.start_date, t.due_date, t.estimated_hours, t.actual_hours,
        t.completion_percentage, t.story_points, t.parent_task_id, t.sprint_id,
        t.depends_on, t.labels, t.metadata, t.created_at, t.updated_at
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN users a ON a.id = t.assignee_id
      LEFT JOIN users r ON r.id = t.reporter_id
      ${where}
      ORDER BY t.start_date ASC NULLS LAST, t.position ASC`,
      params,
    );

    return result.map((row: any) => ({
      id: row.id,
      taskCode: row.task_code,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      taskType: row.task_type,
      projectName: row.project_name || '',
      projectCode: row.project_code || '',
      projectCompletion: Number(row.project_completion) || 0,
      assigneeId: row.assignee_id,
      assigneeName: row.assignee_first_name
        ? `${row.assignee_first_name} ${row.assignee_last_name || ''}`.trim()
        : null,
      assigneeAvatar: row.assignee_avatar || null,
      reporterName: row.reporter_first_name
        ? `${row.reporter_first_name} ${row.reporter_last_name || ''}`.trim()
        : null,
      startDate: row.start_date,
      dueDate: row.due_date,
      estimatedHours: row.estimated_hours ? Number(row.estimated_hours) : null,
      actualHours: row.actual_hours ? Number(row.actual_hours) : 0,
      completionPercentage: Number(row.completion_percentage) || 0,
      storyPoints: row.story_points ? Number(row.story_points) : null,
      parentTaskId: row.parent_task_id,
      sprintId: row.sprint_id,
      projectId: row.project_id,
      dependsOn: row.depends_on || [],
      labels: row.labels || [],
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
}
