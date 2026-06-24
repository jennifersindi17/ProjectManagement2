import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(@InjectRepository(Task) private repo: Repository<Task>) {}

  async findAll(page = 1, limit = 20, projectId?: string, sprintId?: string, status?: string, priority?: string, assigneeId?: string, search?: string) {
    const qb = this.repo.createQueryBuilder('t').where('t.deletedAt IS NULL');
    if (projectId) qb.andWhere('t.projectId = :pid', { pid: projectId });
    if (sprintId) qb.andWhere('t.sprintId = :sid', { sid: sprintId });
    if (status) qb.andWhere('t.status = :status', { status });
    if (priority) qb.andWhere('t.priority = :priority', { priority });
    if (assigneeId) qb.andWhere('t.assigneeId = :aid', { aid: assigneeId });
    if (search) qb.andWhere('(t.title ILIKE :s OR t.taskCode ILIKE :s)', { s: `%${search}%` });
    qb.orderBy('t.position', 'ASC').addOrderBy('t.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const task = await this.repo.findOne({ where: { id, deletedAt: null } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(dto: CreateTaskDto, userId: string) {
    const count = await this.repo.count({ where: { projectId: dto.projectId } });
    const project = await this.repo.query('SELECT code FROM projects WHERE id = $1', [dto.projectId]);
    const code = project.length > 0 ? `${project[0].code}-${String(count + 1).padStart(4, '0')}` : `TSK-${String(count + 1).padStart(4, '0')}`;
    const task = this.repo.create({ ...dto, taskCode: code, reporterId: userId });
    return this.repo.save(task);
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.findOne(id);
    const updateData: any = { ...dto };
    if (dto.status === 'done') updateData.completedAt = new Date();
    await this.repo.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.update(id, { deletedAt: new Date() });
    return { message: 'Task deleted' };
  }
}
