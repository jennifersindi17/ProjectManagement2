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

    // Use raw INSERT to avoid pg type inference issues with nullable UUID columns
    const result = await this.repo.query(
      `INSERT INTO tasks (project_id, parent_task_id, task_code, title, description, status, priority, task_type, reporter_id, depends_on)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::task_status, $7::task_priority, $8::task_type, $9::uuid, $10::text[])
       RETURNING id, task_code, title, description, status, priority, task_type, project_id, parent_task_id, reporter_id, assignee_id,
                 story_points, estimated_hours, actual_hours, due_date, start_date, completion_percentage, position, depends_on, created_at, updated_at`,
      [
        dto.projectId,
        dto.parentTaskId || null,
        code,
        dto.title,
        dto.description || null,
        dto.status || 'backlog',
        dto.priority || 'medium',
        dto.taskType || 'task',
        userId,
        dto.dependsOn || null,
      ],
    );
    const saved = result[0];

    // Log task creation activity
    await this.repo.query(
      `INSERT INTO task_activities (task_id, user_id, action, field_changed, old_value, new_value, created_at)
       VALUES ($1, $2, 'created', 'task', NULL, $3, NOW())`,
      [saved.id, userId, saved.title],
    );

    // Recalculate parent + project progress if this is a subtask
    if (dto.parentTaskId) {
      await this.recalculateProgress(saved.id);
    } else {
      // Top-level task: just update project progress
      if (dto.projectId) {
        await this.calculateProjectProgress(dto.projectId);
      }
    }

    return saved;
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
        // Write to task_activities for the Activity Log UI
        for (const change of changes) {
          await this.repo.query(
            `INSERT INTO task_activities (task_id, user_id, action, field_changed, old_value, new_value, created_at)
             VALUES ($1, $2, 'field_updated', $3, $4, $5, NOW())`,
            [id, userId, change.field, String(change.from), String(change.to)],
          );
        }
      }
    }

    // Recalculate parent + project progress if relevant fields changed
    const fieldsAffectingProgress = ['status', 'completionPercentage', 'estimatedHours'];
    const changedProgressField = fieldsAffectingProgress.some(f => (dto as any)[f] !== undefined);

    if (changedProgressField) {
      await this.recalculateProgress(id);
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
    // Get project ID before soft-delete
    const rows = await this.repo.query(`SELECT project_id FROM tasks WHERE id = $1`, [id]);
    await this.repo.update(id, { deletedAt: new Date() });
    // Recalculate project progress
    if (rows.length > 0) {
      await this.calculateProjectProgress(rows[0].project_id);
    }
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
    const setClause = status === 'done' ? 'status = $1::task_status, completed_at = NOW()' : 'status = $1::task_status';
    await this.repo.query(
      `UPDATE tasks SET ${setClause}, updated_at = NOW() WHERE id = ANY($2::uuid[])`,
      [status, taskIds],
    );
    // Recalculate progress for affected tasks
    for (const id of taskIds) {
      await this.recalculateProgress(id);
    }
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
    // Get project IDs before deleting
    const rows = await this.repo.query(
      `SELECT DISTINCT project_id FROM tasks WHERE id = ANY($1)`,
      [taskIds],
    );
    await this.repo.query(
      `UPDATE tasks SET deleted_at = NOW() WHERE id = ANY($1)`,
      [taskIds],
    );
    // Recalculate project progress
    for (const row of rows) {
      await this.calculateProjectProgress(row.project_id);
    }
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

  // === Duplicate Task ===
  async duplicate(taskId: string, overrides: {
    title?: string;
    assigneeId?: string;
    startDate?: string;
    dueDate?: string;
    taskType?: string;
  }, userId: string) {
    const original = await this.findOne(taskId);

    // Get new task code
    const count = await this.repo.count({ where: { projectId: original.projectId } });
    const project = await this.repo.query('SELECT code FROM projects WHERE id = $1', [original.projectId]);
    const code = project.length > 0
      ? `${project[0].code}-${String(count + 1).padStart(4, '0')}`
      : `TSK-${String(count + 1).padStart(4, '0')}`;

    // Build new task from original, excluding fields that should NOT be copied
    const newTask = this.repo.create({
      projectId: original.projectId,
      sprintId: original.sprintId,
      parentTaskId: original.parentTaskId,
      taskCode: code,
      title: overrides.title || `${original.title} (Copy)`,
      description: original.description,
      status: 'todo', // Always reset to todo
      priority: original.priority,
      taskType: overrides.taskType || original.taskType,
      assigneeId: overrides.assigneeId || original.assigneeId,
      reporterId: userId,
      storyPoints: original.storyPoints,
      estimatedHours: original.estimatedHours,
      actualHours: 0, // Do NOT copy actual hours
      dueDate: overrides.dueDate || original.dueDate,
      startDate: overrides.startDate || original.startDate,
      completionPercentage: 0, // Do NOT copy progress
      labels: original.labels && Array.isArray(original.labels) && original.labels.length > 0 ? original.labels : null,
      dependsOn: null, // simple-array has special serialization; skip to avoid malformed array literal
      position: (original.position || 0) + 1,
    });

    const saved = await this.repo.save(newTask);

    // Copy checklist items (reset completed to false for the new task)
    const checklistItems = await this.getChecklist(taskId);
    for (const item of checklistItems) {
      await this.repo.query(
        `INSERT INTO task_checklist_items (task_id, title, position, completed, created_at)
         VALUES ($1, $2, $3, false, NOW())`,
        [saved.id, item.title, item.position],
      );
    }

    // Copy attachments (optional — reference only, no file duplication)
    const attachments: any[] = await this.repo.query(
      `SELECT file_name, file_url, file_size, mime_type, uploaded_by
       FROM task_attachments WHERE task_id = $1 AND deleted_at IS NULL`,
      [taskId],
    );
    for (const att of attachments) {
      await this.repo.query(
        `INSERT INTO task_attachments (task_id, file_name, file_url, file_size, mime_type, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [saved.id, att.file_name, att.file_url, att.file_size, att.mime_type, att.uploaded_by],
      );
    }

    // Log duplication activity
    await this.repo.query(
      `INSERT INTO task_activities (task_id, user_id, action, field_changed, old_value, new_value, created_at)
       VALUES ($1, $2, 'duplication', 'task', $3, $4, NOW())`,
      [saved.id, userId, original.id, saved.title],
    );

    // Recalculate project progress (new task added)
    if (saved.projectId) {
      await this.calculateProjectProgress(saved.projectId);
    }

    return saved;
  }

  // === Progress Calculation Engine ===

  /**
   * Calculate a single task's progress from its subtasks.
   * If the task has no subtasks, returns its own completion Updates the task in DB and recurses upward to parent.
   */
  async calculateTaskProgress(taskId: string): Promise<number> {
    const taskRows = await this.repo.query(
      `SELECT id, parent_task_id, completion_percentage FROM tasks WHERE id = $1 AND deleted_at IS NULL`,
      [taskId],
    );
    if (taskRows.length === 0) return 0;
    const task = taskRows[0];

    // Get direct children
    const subtasks = await this.repo.query(
      `SELECT completion_percentage, estimated_hours, status
       FROM tasks WHERE parent_task_id = $1 AND deleted_at IS NULL`,
      [taskId],
    );

    let newProgress: number;

    if (subtasks.length === 0) {
      // Leaf task: use its own progress
      newProgress = parseFloat(task.completion_percentage) || 0;
    } else {
      // Parent task: average of subtask progress (equal weight per spec)
      const sum = subtasks.reduce((acc: number, s: any) => acc + (parseFloat(s.completion_percentage) || 0), 0);
      newProgress = Math.round((sum / subtasks.length) * 100) / 100;
    }

    // Determine aggregated status from subtasks
    const statuses = subtasks.map((s: any) => s.status);
    let aggStatus = 'todo';
    if (statuses.length > 0 && statuses.every((s: string) => s === 'done' || s === 'cancelled')) {
      aggStatus = 'done';
    } else if (statuses.some((s: string) => s === 'in_progress' || s === 'review' || s === 'testing')) {
      aggStatus = 'in_progress';
    } else if (statuses.some((s: string) => s === 'blocked')) {
      aggStatus = 'blocked';
    }

    // Update this task
    await this.repo.query(
      `UPDATE tasks SET completion_percentage = $1, status = COALESCE($2::task_status, status),
       completed_at = CASE WHEN $2::text = 'done' THEN NOW() WHEN $2::text != 'done' THEN NULL ELSE completed_at END,
       updated_at = NOW()
       WHERE id = $3::uuid`,
      [newProgress, subtasks.length > 0 ? aggStatus : null, taskId],
    );

    // Recurse upward
    if (task.parent_task_id) {
      await this.calculateTaskProgress(task.parent_task_id);
    }

    return newProgress;
  }

  /**
   * Calculate project progress from all top-level tasks.
   * Updates project.completion_percentage in DB.
   */
  async calculateProjectProgress(projectId: string): Promise<number> {
    // Get all top-level tasks (no parent) for this project
    const topLevelTasks = await this.repo.query(
      `SELECT completion_percentage FROM tasks WHERE project_id = $1 AND parent_task_id IS NULL AND deleted_at IS NULL`,
      [projectId],
    );

    let projectProgress = 0;
    if (topLevelTasks.length > 0) {
      const sum = topLevelTasks.reduce((acc: number, t: any) => acc + (parseFloat(t.completion_percentage) || 0), 0);
      projectProgress = Math.round((sum / topLevelTasks.length) * 100) / 100;
    }

    // Cache in project table
    await this.repo.query(
      `UPDATE projects SET completion_percentage = $1, updated_at = NOW() WHERE id = $2::uuid`,
      [projectProgress, projectId],
    );

    return projectProgress;
  }

  /**
   * Full recalculation: task → parent chain → project.
   * Call this after any task/subtask mutation.
   */
  async recalculateProgress(taskId: string) {
    // First recalculate the task itself (and recurse up)
    await this.calculateTaskProgress(taskId);

    // Get the project for this task
    const rows = await this.repo.query(
      `SELECT project_id FROM tasks WHERE id = $1`,
      [taskId],
    );
    if (rows.length === 0) return;
    const projectId = rows[0].project_id;

    // Recalculate project progress
    await this.calculateProjectProgress(projectId);
  }

  // === Hierarchy: Get Subtasks ===
  async getSubtasks(parentTaskId: string) {
    return this.repo.query(
      `SELECT t.*,
              u.first_name as assignee_first_name, u.last_name as assignee_last_name, u.avatar_url as assignee_avatar
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.parent_task_id = $1 AND t.deleted_at IS NULL
       ORDER BY t.position ASC, t.created_at ASC`,
      [parentTaskId],
    );
  }

  // === Hierarchy: Get Full Task Tree ===
  async getTaskTree(projectId: string) {
    const allTasks = await this.repo.query(
      `SELECT t.id, t.title, t.task_code, t.status, t.priority, t.task_type,
              t.completion_percentage, t.parent_task_id, t.estimated_hours,
              t.start_date, t.due_date, t.position
       FROM tasks t
       WHERE t.project_id = $1 AND t.deleted_at IS NULL
       ORDER BY t.position ASC, t.created_at ASC`,
      [projectId],
    );

    // Build tree
    const taskMap = new Map();
    allTasks.forEach((t: any) => {
      taskMap.set(t.id, { ...t, children: [] });
    });

    const roots: any[] = [];
    allTasks.forEach((t: any) => {
      const node = taskMap.get(t.id);
      if (t.parent_task_id && taskMap.has(t.parent_task_id)) {
        taskMap.get(t.parent_task_id).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
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
