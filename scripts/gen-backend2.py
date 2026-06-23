#!/usr/bin/env python3
"""Generate remaining NestJS backend modules for ProjectFlow 2.0"""

import os
BASE = "/Users/jenjen/projectflow2/backend"

def write(rel_path, content):
    full = os.path.join(BASE, rel_path)
    os.path.exists(os.path.dirname(full)) or os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w') as f:
        f.write(content)
    print(f"  ✓ {rel_path}")

# ============================================
# TASKS MODULE
# ============================================
write("src/modules/tasks/entities/task.entity.ts", '''import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) projectId: string;
  @Column({ type: 'uuid', nullable: true }) sprintId: string;
  @Column({ type: 'uuid', nullable: true }) parentTaskId: string;
  @Column({ type: 'varchar', length: 20 }) taskCode: string;
  @Column({ type: 'varchar', length: 255 }) title: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'enum', enum: ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked', 'cancelled'], default: 'backlog' }) status: string;
  @Column({ type: 'enum', enum: ['critical', 'high', 'medium', 'low'], default: 'medium' }) priority: string;
  @Column({ type: 'enum', enum: ['feature', 'bug', 'improvement', 'task', 'epic', 'story', 'subtask'], default: 'task' }) taskType: string;
  @Column({ type: 'uuid', nullable: true }) assigneeId: string;
  @Column({ type: 'uuid' }) reporterId: string;
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true }) storyPoints: number;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) estimatedHours: number;
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 }) actualHours: number;
  @Column({ type: 'date', nullable: true }) dueDate: Date;
  @Column({ type: 'date', nullable: true }) startDate: Date;
  @Column({ type: 'timestamptz', nullable: true }) completedAt: Date;
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 }) completionPercentage: number;
  @Column({ type: 'int', default: 0 }) position: number;
  @Column({ type: 'text', array: true, default: {} }) labels: string[];
  @Column({ type: 'jsonb', default: {} }) metadata: any;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt: Date;
}
''')

write("src/modules/tasks/dto/create-task.dto.ts", '''import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sprintId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() parentTaskId?: string;
  @ApiProperty({ example: 'Setup database schema' }) @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked'] })
  @IsOptional() @IsEnum(['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked']) status?: string;
  @ApiPropertyOptional({ enum: ['critical', 'high', 'medium', 'low'] })
  @IsOptional() @IsEnum(['critical', 'high', 'medium', 'low']) priority?: string;
  @ApiPropertyOptional({ enum: ['feature', 'bug', 'improvement', 'task', 'epic', 'story', 'subtask'] })
  @IsOptional() @IsEnum(['feature', 'bug', 'improvement', 'task', 'epic', 'story', 'subtask']) taskType?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assigneeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() storyPoints?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() estimatedHours?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
}
''')

write("src/modules/tasks/dto/update-task.dto.ts", '''import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
''')

write("src/modules/tasks/tasks.service.ts", '''import { Injectable, NotFoundException } from '@nestjs/common';
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
    if (dto.status === 'done') dto.completedAt = new Date();
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.update(id, { deletedAt: new Date() });
    return { message: 'Task deleted' };
  }
}
''')

write("src/modules/tasks/tasks.controller.ts", '''import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Get() @ApiOperation({ summary: 'List all tasks' })
  findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('projectId') projectId: string, @Query('sprintId') sprintId: string, @Query('status') status: string, @Query('priority') priority: string, @Query('assigneeId') assigneeId: string, @Query('search') search: string) {
    return this.service.findAll(page || 1, limit || 20, projectId, sprintId, status, priority, assigneeId, search);
  }

  @Get(':id') @ApiOperation({ summary: 'Get task by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create task' })
  create(@Body() dto: CreateTaskDto, @CurrentUser('id') userId: string) { return this.service.create(dto, userId); }

  @Patch(':id') @ApiOperation({ summary: 'Update task' })
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete task' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
''')

write("src/modules/tasks/tasks.module.ts", '''import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
@Module({ imports: [TypeOrmModule.forFeature([Task])], controllers: [TasksController], providers: [TasksService], exports: [TasksService] })
export class TasksModule {}
''')

# ============================================
# SPRINTS MODULE
# ============================================
write("src/modules/sprints/entities/sprint.entity.ts", '''import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('sprints')
export class Sprint {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) projectId: string;
  @Column({ type: 'varchar', length: 100 }) name: string;
  @Column({ type: 'text', nullable: true }) goal: string;
  @Column({ type: 'enum', enum: ['planning', 'active', 'completed', 'cancelled'], default: 'planning' }) status: string;
  @Column({ type: 'date' }) startDate: Date;
  @Column({ type: 'date' }) endDate: Date;
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 }) totalStoryPoints: number;
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 }) completedStoryPoints: number;
  @Column({ type: 'uuid' }) createdBy: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
''')

write("src/modules/sprints/sprints.service.ts", '''import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sprint } from './entities/sprint.entity';

@Injectable()
export class SprintsService {
  constructor(@InjectRepository(Sprint) private repo: Repository<Sprint>) {}

  async findAll(projectId: string) {
    return this.repo.find({ where: { projectId }, orderBy: { startDate: 'DESC' } });
  }

  async findOne(id: string) {
    const sprint = await this.repo.findOne({ where: { id } });
    if (!sprint) throw new NotFoundException('Sprint not found');
    return sprint;
  }

  async create(dto: any) {
    const sprint = this.repo.create(dto);
    return this.repo.save(sprint);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { message: 'Sprint deleted' };
  }
}
''')

write("src/modules/sprints/sprints.controller.ts", '''import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SprintsService } from './sprints.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Sprints')
@Controller('sprints')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SprintsController {
  constructor(private readonly service: SprintsService) {}

  @Get() @ApiOperation({ summary: 'List sprints' })
  findAll(@Param('projectId') projectId: string) { return this.service.findAll(projectId); }

  @Get(':id') @ApiOperation({ summary: 'Get sprint by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create sprint' })
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update sprint' })
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete sprint' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
''')

write("src/modules/sprints/sprints.module.ts", '''import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sprint } from './entities/sprint.entity';
import { SprintsService } from './sprints.service';
import { SprintsController } from './sprints.controller';
@Module({ imports: [TypeOrmModule.forFeature([Sprint])], controllers: [SprintsController], providers: [SprintsService] })
export class SprintsModule {}
''')

# ============================================
# TIMESHEETS MODULE
# ============================================
write("src/modules/timesheets/entities/timesheet.entity.ts", '''import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('timesheets')
export class Timesheet {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) userId: string;
  @Column({ type: 'uuid' }) projectId: string;
  @Column({ type: 'uuid', nullable: true }) taskId: string;
  @Column({ type: 'date' }) date: Date;
  @Column({ type: 'decimal', precision: 5, scale: 2 }) hours: number;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) activityType: string;
  @Column({ type: 'enum', enum: ['draft', 'submitted', 'approved', 'rejected'], default: 'draft' }) status: string;
  @Column({ type: 'uuid', nullable: true }) approvedBy: string;
  @Column({ type: 'timestamptz', nullable: true }) approvedAt: Date;
  @Column({ type: 'text', nullable: true }) rejectionReason: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
''')

write("src/modules/timesheets/timesheets.service.ts", '''import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Timesheet } from './entities/timesheet.entity';

@Injectable()
export class TimesheetsService {
  constructor(@InjectRepository(Timesheet) private repo: Repository<Timesheet>) {}

  async findAll(page = 1, limit = 20, userId?: string, projectId?: string, status?: string) {
    const qb = this.repo.createQueryBuilder('t');
    if (userId) qb.andWhere('t.userId = :uid', { uid: userId });
    if (projectId) qb.andWhere('t.projectId = :pid', { pid: projectId });
    if (status) qb.andWhere('t.status = :status', { status });
    qb.orderBy('t.date', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const ts = await this.repo.findOne({ where: { id } });
    if (!ts) throw new NotFoundException('Timesheet not found');
    return ts;
  }

  async create(dto: any) {
    const ts = this.repo.create(dto);
    return this.repo.save(ts);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async approve(id: string, approverId: string) {
    await this.repo.update(id, { status: 'approved', approvedBy: approverId, approvedAt: new Date() });
    return this.findOne(id);
  }

  async reject(id: string, reason: string) {
    await this.repo.update(id, { status: 'rejected', rejectionReason: reason });
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { message: 'Timesheet deleted' };
  }
}
''')

write("src/modules/timesheets/timesheets.controller.ts", '''import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TimesheetsService } from './timesheets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Timesheets')
@Controller('timesheets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TimesheetsController {
  constructor(private readonly service: TimesheetsService) {}

  @Get() @ApiOperation({ summary: 'List timesheets' })
  findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('userId') userId: string, @Query('projectId') projectId: string, @Query('status') status: string) {
    return this.service.findAll(page || 1, limit || 20, userId, projectId, status);
  }

  @Get(':id') @ApiOperation({ summary: 'Get timesheet by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create timesheet entry' })
  create(@Body() dto: any, @CurrentUser('id') userId: string) { return this.service.create({ ...dto, userId }); }

  @Patch(':id') @ApiOperation({ summary: 'Update timesheet' })
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Patch(':id/approve') @ApiOperation({ summary: 'Approve timesheet' })
  approve(@Param('id') id: string, @CurrentUser('id') userId: string) { return this.service.approve(id, userId); }

  @Patch(':id/reject') @ApiOperation({ summary: 'Reject timesheet' })
  reject(@Param('id') id: string, @Body('reason') reason: string) { return this.service.reject(id, reason); }

  @Delete(':id') @ApiOperation({ summary: 'Delete timesheet' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
''')

write("src/modules/timesheets/timesheets.module.ts", '''import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Timesheet } from './entities/timesheet.entity';
import { TimesheetsService } from './timesheets.service';
import { TimesheetsController } from './timesheets.controller';
@Module({ imports: [TypeOrmModule.forFeature([Timesheet])], controllers: [TimesheetsController], providers: [TimesheetsService] })
export class TimesheetsModule {}
''')

# ============================================
# ISSUES MODULE
# ============================================
write("src/modules/issues/entities/issue.entity.ts", '''import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) projectId: string;
  @Column({ type: 'varchar', length: 20 }) issueCode: string;
  @Column({ type: 'varchar', length: 255 }) title: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'enum', enum: ['open', 'in_progress', 'investigation', 'fixed', 'closed', 'reopened'], default: 'open' }) status: string;
  @Column({ type: 'enum', enum: ['critical', 'major', 'minor', 'trivial'], default: 'minor' }) severity: string;
  @Column({ type: 'varchar', length: 50, nullable: true }) category: string;
  @Column({ type: 'uuid', nullable: true }) assigneeId: string;
  @Column({ type: 'uuid' }) reporterId: string;
  @Column({ type: 'text', nullable: true }) resolution: string;
  @Column({ type: 'date', nullable: true }) dueDate: Date;
  @Column({ type: 'timestamptz', nullable: true }) resolvedAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) closedAt: Date;
  @Column({ type: 'jsonb', default: {} }) metadata: any;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
''')

write("src/modules/issues/dto/create-issue.dto.ts", '''import { IsString, IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIssueDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty({ example: 'Database timeout' }) @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: ['critical', 'major', 'minor', 'trivial'] }) @IsOptional() @IsEnum(['critical', 'major', 'minor', 'trivial']) severity?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assigneeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
}
''')

write("src/modules/issues/dto/update-issue.dto.ts", '''import { PartialType } from '@nestjs/swagger';
import { CreateIssueDto } from './create-issue.dto';
export class UpdateIssueDto extends PartialType(CreateIssueDto) {}
''')

write("src/modules/issues/issues.service.ts", '''import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from './entities/issue.entity';

@Injectable()
export class IssuesService {
  constructor(@InjectRepository(Issue) private repo: Repository<Issue>) {}

  async findAll(page = 1, limit = 20, projectId?: string, status?: string, severity?: string) {
    const qb = this.repo.createQueryBuilder('i');
    if (projectId) qb.andWhere('i.projectId = :pid', { pid: projectId });
    if (status) qb.andWhere('i.status = :status', { status });
    if (severity) qb.andWhere('i.severity = :sev', { sev: severity });
    qb.orderBy('i.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const issue = await this.repo.findOne({ where: { id } });
    if (!issue) throw new NotFoundException('Issue not found');
    return issue;
  }

  async create(dto: any, userId: string) {
    const count = await this.repo.count({ where: { projectId: dto.projectId } });
    const code = `ISS-${String(count + 1).padStart(4, '0')}`;
    const issue = this.repo.create({ ...dto, issueCode: code, reporterId: userId });
    return this.repo.save(issue);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { message: 'Issue deleted' };
  }
}
''')

write("src/modules/issues/issues.controller.ts", '''import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Issues')
@Controller('issues')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IssuesController {
  constructor(private readonly service: IssuesService) {}

  @Get() @ApiOperation({ summary: 'List issues' })
  findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('projectId') projectId: string, @Query('status') status: string, @Query('severity') severity: string) {
    return this.service.findAll(page || 1, limit || 20, projectId, status, severity);
  }

  @Get(':id') @ApiOperation({ summary: 'Get issue by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create issue' })
  create(@Body() dto: CreateIssueDto, @CurrentUser('id') userId: string) { return this.service.create(dto, userId); }

  @Patch(':id') @ApiOperation({ summary: 'Update issue' })
  update(@Param('id') id: string, @Body() dto: UpdateIssueDto) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete issue' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
''')

write("src/modules/issues/issues.module.ts", '''import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from './entities/issue.entity';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';
@Module({ imports: [TypeOrmModule.forFeature([Issue])], controllers: [IssuesController], providers: [IssuesService] })
export class IssuesModule {}
''')

# ============================================
# RISKS MODULE
# ============================================
write("src/modules/risks/entities/risk.entity.ts", '''import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('risks')
export class Risk {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) projectId: string;
  @Column({ type: 'varchar', length: 20 }) riskCode: string;
  @Column({ type: 'varchar', length: 255 }) title: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'int' }) probability: number;
  @Column({ type: 'int' }) impact: number;
  @Column({ type: 'enum', enum: ['very_low', 'low', 'medium', 'high', 'very_high'], default: 'medium' }) riskLevel: string;
  @Column({ type: 'enum', enum: ['identified', 'assessed', 'mitigated', 'monitoring', 'closed', 'occurred'], default: 'identified' }) status: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) category: string;
  @Column({ type: 'text', nullable: true }) mitigationPlan: string;
  @Column({ type: 'text', nullable: true }) contingencyPlan: string;
  @Column({ type: 'uuid', nullable: true }) ownerId: string;
  @Column({ type: 'date', default: () => 'CURRENT_DATE' }) identifiedDate: Date;
  @Column({ type: 'date', nullable: true }) targetDate: Date;
  @Column({ type: 'timestamptz', nullable: true }) closedAt: Date;
  @Column({ type: 'jsonb', default: {} }) metadata: any;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
''')

write("src/modules/risks/risks.service.ts", '''import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Risk } from './entities/risk.entity';

@Injectable()
export class RisksService {
  constructor(@InjectRepository(Risk) private repo: Repository<Risk>) {}

  async findAll(projectId: string) {
    return this.repo.find({ where: { projectId }, orderBy: { probability: 'DESC', impact: 'DESC' } });
  }

  async findOne(id: string) {
    const risk = await this.repo.findOne({ where: { id } });
    if (!risk) throw new NotFoundException('Risk not found');
    return risk;
  }

  async create(dto: any) {
    const count = await this.repo.count({ where: { projectId: dto.projectId } });
    const code = `RSK-${String(count + 1).padStart(4, '0')}`;
    const risk = this.repo.create({ ...dto, riskCode: code });
    return this.repo.save(risk);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { message: 'Risk deleted' };
  }
}
''')

write("src/modules/risks/risks.controller.ts", '''import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RisksService } from './risks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Risks')
@Controller('risks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RisksController {
  constructor(private readonly service: RisksService) {}

  @Get() @ApiOperation({ summary: 'List risks' })
  findAll(@Param('projectId') projectId: string) { return this.service.findAll(projectId); }

  @Get(':id') @ApiOperation({ summary: 'Get risk by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create risk' })
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update risk' })
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete risk' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
''')

write("src/modules/risks/risks.module.ts", '''import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Risk } from './entities/risk.entity';
import { RisksService } from './risks.service';
import { RisksController } from './risks.controller';
@Module({ imports: [TypeOrmModule.forFeature([Risk])], controllers: [RisksController], providers: [RisksService] })
export class RisksModule {}
''')

# ============================================
# CHANGE REQUESTS MODULE
# ============================================
write("src/modules/change-requests/entities/change-request.entity.ts", '''import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('change_requests')
export class ChangeRequest {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) projectId: string;
  @Column({ type: 'varchar', length: 20 }) crCode: string;
  @Column({ type: 'varchar', length: 255 }) title: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'text', nullable: true }) justification: string;
  @Column({ type: 'text', nullable: true }) impactAnalysis: string;
  @Column({ type: 'enum', enum: ['draft', 'review', 'approved', 'rejected', 'in_development', 'testing', 'deployed', 'closed'], default: 'draft' }) status: string;
  @Column({ type: 'uuid' }) requestedBy: string;
  @Column({ type: 'uuid', nullable: true }) reviewedBy: string;
  @Column({ type: 'uuid', nullable: true }) approvedBy: string;
  @Column({ type: 'timestamptz', nullable: true }) approvedAt: Date;
  @Column({ type: 'text', nullable: true }) rejectedReason: string;
  @Column({ type: 'enum', enum: ['critical', 'high', 'medium', 'low'], default: 'medium' }) priority: string;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) estimatedCost: number;
  @Column({ type: 'date', nullable: true }) targetDate: Date;
  @Column({ type: 'timestamptz', nullable: true }) completedAt: Date;
  @Column({ type: 'jsonb', default: {} }) metadata: any;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
''')

write("src/modules/change-requests/change-requests.service.ts", '''import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChangeRequest } from './entities/change-request.entity';

@Injectable()
export class ChangeRequestsService {
  constructor(@InjectRepository(ChangeRequest) private repo: Repository<ChangeRequest>) {}

  async findAll(page = 1, limit = 20, projectId?: string, status?: string) {
    const qb = this.repo.createQueryBuilder('cr');
    if (projectId) qb.andWhere('cr.projectId = :pid', { pid: projectId });
    if (status) qb.andWhere('cr.status = :status', { status });
    qb.orderBy('cr.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const cr = await this.repo.findOne({ where: { id } });
    if (!cr) throw new NotFoundException('Change request not found');
    return cr;
  }

  async create(dto: any, userId: string) {
    const count = await this.repo.count({ where: { projectId: dto.projectId } });
    const code = `CR-${String(count + 1).padStart(4, '0')}`;
    const cr = this.repo.create({ ...dto, crCode: code, requestedBy: userId });
    return this.repo.save(cr);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { message: 'Change request deleted' };
  }
}
''')

write("src/modules/change-requests/change-requests.controller.ts", '''import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChangeRequestsService } from './change-requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Change Requests')
@Controller('change-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChangeRequestsController {
  constructor(private readonly service: ChangeRequestsService) {}

  @Get() @ApiOperation({ summary: 'List change requests' })
  findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('projectId') projectId: string, @Query('status') status: string) {
    return this.service.findAll(page || 1, limit || 20, projectId, status);
  }

  @Get(':id') @ApiOperation({ summary: 'Get change request by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create change request' })
  create(@Body() dto: any, @CurrentUser('id') userId: string) { return this.service.create(dto, userId); }

  @Patch(':id') @ApiOperation({ summary: 'Update change request' })
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete change request' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
''')

write("src/modules/change-requests/change-requests.module.ts", '''import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChangeRequest } from './entities/change-request.entity';
import { ChangeRequestsService } from './change-requests.service';
import { ChangeRequestsController } from './change-requests.controller';
@Module({ imports: [TypeOrmModule.forFeature([ChangeRequest])], controllers: [ChangeRequestsController], providers: [ChangeRequestsService] })
export class ChangeRequestsModule {}
''')

# ============================================
# DOCUMENTS MODULE
# ============================================
write("src/modules/documents/entities/document.entity.ts", '''import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) projectId: string;
  @Column({ type: 'varchar', length: 255 }) name: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'enum', enum: ['contract', 'brd', 'fsd', 'sit', 'uat', 'mom', 'training_material', 'report', 'other'], default: 'other' }) category: string;
  @Column({ type: 'enum', enum: ['draft', 'review', 'approved', 'archived'], default: 'draft' }) status: string;
  @Column({ type: 'varchar', length: 500 }) fileUrl: string;
  @Column({ type: 'varchar', length: 255 }) fileName: string;
  @Column({ type: 'bigint', nullable: true }) fileSize: number;
  @Column({ type: 'varchar', length: 100, nullable: true }) fileType: string;
  @Column({ type: 'varchar', length: 20, default: '1.0' }) version: string;
  @Column({ type: 'uuid' }) uploadedBy: string;
  @Column({ type: 'uuid', nullable: true }) approvedBy: string;
  @Column({ type: 'timestamptz', nullable: true }) approvedAt: Date;
  @Column({ type: 'text', array: true, default: {} }) tags: string[];
  @Column({ type: 'jsonb', default: {} }) metadata: any;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt: Date;
}
''')

write("src/modules/documents/documents.service.ts", '''import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';

@Injectable()
export class DocumentsService {
  constructor(@InjectRepository(Document) private repo: Repository<Document>) {}

  async findAll(page = 1, limit = 20, projectId?: string, category?: string, status?: string) {
    const qb = this.repo.createQueryBuilder('d').where('d.deletedAt IS NULL');
    if (projectId) qb.andWhere('d.projectId = :pid', { pid: projectId });
    if (category) qb.andWhere('d.category = :cat', { cat: category });
    if (status) qb.andWhere('d.status = :status', { status });
    qb.orderBy('d.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const doc = await this.repo.findOne({ where: { id, deletedAt: null } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async create(dto: any) {
    const doc = this.repo.create(dto);
    return this.repo.save(doc);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.update(id, { deletedAt: new Date() });
    return { message: 'Document deleted' };
  }
}
''')

write("src/modules/documents/documents.controller.ts", '''import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Get() @ApiOperation({ summary: 'List documents' })
  findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('projectId') projectId: string, @Query('category') category: string, @Query('status') status: string) {
    return this.service.findAll(page || 1, limit || 20, projectId, category, status);
  }

  @Get(':id') @ApiOperation({ summary: 'Get document by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Upload document' })
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update document' })
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete document' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
''')

write("src/modules/documents/documents.module.ts", '''import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
@Module({ imports: [TypeOrmModule.forFeature([Document])], controllers: [DocumentsController], providers: [DocumentsService] })
export class DocumentsModule {}
''')

# ============================================
# MEETINGS MODULE
# ============================================
write("src/modules/meetings/entities/meeting.entity.ts", '''import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid', nullable: true }) projectId: string;
  @Column({ type: 'varchar', length: 255 }) title: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'varchar', length: 50, default: 'general' }) meetingType: string;
  @Column({ type: 'timestamptz' }) startTime: Date;
  @Column({ type: 'timestamptz', nullable: true }) endTime: Date;
  @Column({ type: 'varchar', length: 255, nullable: true }) location: string;
  @Column({ type: 'varchar', length: 500, nullable: true }) meetingLink: string;
  @Column({ type: 'uuid' }) organizerId: string;
  @Column({ type: 'varchar', length: 20, default: 'scheduled' }) status: string;
  @Column({ type: 'text', nullable: true }) minutes: string;
  @Column({ type: 'jsonb', default: '[]' }) actionItems: any;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
''')

write("src/modules/meetings/meetings.service.ts", '''import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting } from './entities/meeting.entity';

@Injectable()
export class MeetingsService {
  constructor(@InjectRepository(Meeting) private repo: Repository<Meeting>) {}

  async findAll(page = 1, limit = 20, projectId?: string) {
    const qb = this.repo.createQueryBuilder('m');
    if (projectId) qb.andWhere('m.projectId = :pid', { pid: projectId });
    qb.orderBy('m.startTime', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const meeting = await this.repo.findOne({ where: { id } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }

  async create(dto: any) {
    const meeting = this.repo.create(dto);
    return this.repo.save(meeting);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { message: 'Meeting deleted' };
  }
}
''')

write("src/modules/meetings/meetings.controller.ts", '''import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Meetings')
@Controller('meetings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MeetingsController {
  constructor(private readonly service: MeetingsService) {}

  @Get() @ApiOperation({ summary: 'List meetings' })
  findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('projectId') projectId: string) {
    return this.service.findAll(page || 1, limit || 20, projectId);
  }

  @Get(':id') @ApiOperation({ summary: 'Get meeting by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create meeting' })
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update meeting' })
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete meeting' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
''')

write("src/modules/meetings/meetings.module.ts", '''import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting } from './entities/meeting.entity';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
@Module({ imports: [TypeOrmModule.forFeature([Meeting])], controllers: [MeetingsController], providers: [MeetingsService] })
export class MeetingsModule {}
''')

# ============================================
# NOTIFICATIONS MODULE
# ============================================
write("src/modules/notifications/entities/notification.entity.ts", '''import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) userId: string;
  @Column({ type: 'enum', enum: ['task_assigned', 'task_updated', 'comment_added', 'mention', 'project_update', 'risk_alert', 'deadline_reminder', 'approval_request', 'system'] }) type: string;
  @Column({ type: 'varchar', length: 255 }) title: string;
  @Column({ type: 'text', nullable: true }) message: string;
  @Column({ type: 'varchar', length: 50, nullable: true }) referenceType: string;
  @Column({ type: 'uuid', nullable: true }) referenceId: string;
  @Column({ type: 'boolean', default: false }) isRead: boolean;
  @Column({ type: 'timestamptz', nullable: true }) readAt: Date;
  @Column({ type: 'varchar', length: 500, nullable: true }) actionUrl: string;
  @Column({ type: 'jsonb', default: {} }) metadata: any;
  @CreateDateColumn() createdAt: Date;
}
''')

write("src/modules/notifications/notifications.service.ts", '''import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(Notification) private repo: Repository<Notification>) {}

  async findAll(userId: string, page = 1, limit = 20) {
    const qb = this.repo.createQueryBuilder('n').where('n.userId = :uid', { uid: userId });
    qb.orderBy('n.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async markAsRead(id: string, userId: string) {
    await this.repo.update({ id, userId }, { isRead: true, readAt: new Date() });
    return { message: 'Marked as read' };
  }

  async markAllAsRead(userId: string) {
    await this.repo.update({ userId, isRead: false }, { isRead: true, readAt: new Date() });
    return { message: 'All marked as read' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.repo.count({ where: { userId, isRead: false } });
    return { count };
  }

  async create(dto: any) {
    const notification = this.repo.create(dto);
    return this.repo.save(notification);
  }
}
''')

write("src/modules/notifications/notifications.controller.ts", '''import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get() @ApiOperation({ summary: 'List notifications' })
  findAll(@CurrentUser('id') userId: string, @Query('page') page: number, @Query('limit') limit: number) {
    return this.service.findAll(userId, page || 1, limit || 20);
  }

  @Get('unread-count') @ApiOperation({ summary: 'Get unread count' })
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.service.getUnreadCount(userId);
  }

  @Patch(':id/read') @ApiOperation({ summary: 'Mark as read' })
  markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.markAsRead(id, userId);
  }

  @Patch('read-all') @ApiOperation({ summary: 'Mark all as read' })
  markAllAsRead(@CurrentUser('id') userId: string) {
    return this.service.markAllAsRead(userId);
  }
}
''')

write("src/modules/notifications/notifications.module.ts", '''import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
@Module({ imports: [TypeOrmModule.forFeature([Notification])], controllers: [NotificationsController], providers: [NotificationsService] })
export class NotificationsModule {}
''')

# ============================================
# AUDIT MODULE
# ============================================
write("src/modules/audit/entities/audit-log.entity.ts", '''import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid', nullable: true }) userId: string;
  @Column({ type: 'enum', enum: ['create', 'update', 'delete', 'login', 'logout', 'export', 'import', 'approve', 'reject', 'assign', 'status_change'] }) action: string;
  @Column({ type: 'varchar', length: 50 }) entityType: string;
  @Column({ type: 'uuid', nullable: true }) entityId: string;
  @Column({ type: 'jsonb', nullable: true }) oldValues: any;
  @Column({ type: 'jsonb', nullable: true }) newValues: any;
  @Column({ type: 'inet', nullable: true }) ipAddress: string;
  @Column({ type: 'text', nullable: true }) userAgent: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) requestId: string;
  @Column({ type: 'jsonb', default: {} }) metadata: any;
  @CreateDateColumn() createdAt: Date;
}
''')

write("src/modules/audit/audit.service.ts", '''import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private repo: Repository<AuditLog>) {}

  async findAll(page = 1, limit = 50, userId?: string, entityType?: string, action?: string) {
    const qb = this.repo.createQueryBuilder('a');
    if (userId) qb.andWhere('a.userId = :uid', { uid: userId });
    if (entityType) qb.andWhere('a.entityType = :et', { et: entityType });
    if (action) qb.andWhere('a.action = :action', { action });
    qb.orderBy('a.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async log(dto: any) {
    const log = this.repo.create(dto);
    return this.repo.save(log);
  }
}
''')

write("src/modules/audit/audit.controller.ts", '''import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'director')
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get() @ApiOperation({ summary: 'List audit logs (Admin only)' })
  findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('userId') userId: string, @Query('entityType') entityType: string, @Query('action') action: string) {
    return this.service.findAll(page || 1, limit || 50, userId, entityType, action);
  }
}
''')

write("src/modules/audit/audit.module.ts", '''import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
@Module({ imports: [TypeOrmModule.forFeature([AuditLog])], controllers: [AuditController], providers: [AuditService] })
export class AuditModule {}
''')

# ============================================
# DASHBOARD MODULE
# ============================================
write("src/modules/dashboard/dashboard.service.ts", '''import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { Issue } from '../issues/entities/issue.entity';
import { Risk } from '../risks/entities/risk.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project) private projectsRepo: Repository<Project>,
    @InjectRepository(Task) private tasksRepo: Repository<Task>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Issue) private issuesRepo: Repository<Issue>,
    @InjectRepository(Risk) private risksRepo: Repository<Risk>,
  ) {}

  async getStats() {
    const [totalProjects, activeProjects, totalTasks, completedTasks, totalUsers, openIssues, openRisks] = await Promise.all([
      this.projectsRepo.count({ where: { deletedAt: null } }),
      this.projectsRepo.count({ where: { deletedAt: null, status: 'development' } }),
      this.tasksRepo.count({ where: { deletedAt: null } }),
      this.tasksRepo.count({ where: { deletedAt: null, status: 'done' } }),
      this.usersRepo.count({ where: { deletedAt: null, status: 'active' } }),
      this.issuesRepo.count({ where: { status: 'open' } }),
      this.risksRepo.count({ where: { status: 'identified' } }),
    ]);

    return {
      totalProjects, activeProjects, totalTasks, completedTasks, totalUsers, openIssues, openRisks,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }

  async getProjectDashboard() {
    const projects = await this.projectsRepo.find({ where: { deletedAt: null }, take: 10, orderBy: { createdAt: 'DESC' } });
    return projects;
  }

  async getRecentActivities() {
    const tasks = await this.tasksRepo.find({ where: { deletedAt: null }, take: 10, orderBy: { updatedAt: 'DESC' } });
    return tasks;
  }
}
''')

write("src/modules/dashboard/dashboard.controller.ts", '''import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats') @ApiOperation({ summary: 'Get dashboard statistics' })
  getStats() { return this.service.getStats(); }

  @Get('projects') @ApiOperation({ summary: 'Get project dashboard' })
  getProjectDashboard() { return this.service.getProjectDashboard(); }

  @Get('activities') @ApiOperation({ summary: 'Get recent activities' })
  getRecentActivities() { return this.service.getRecentActivities(); }
}
''')

write("src/modules/dashboard/dashboard.module.ts", '''import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { Issue } from '../issues/entities/issue.entity';
import { Risk } from '../risks/entities/risk.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
@Module({
  imports: [TypeOrmModule.forFeature([Project, Task, User, Issue, Risk])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
''')

# ============================================
# BUDGET MODULE
# ============================================
write("src/modules/budget/entities/budget-entry.entity.ts", '''import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('budget_entries')
export class BudgetEntry {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) projectId: string;
  @Column({ type: 'varchar', length: 100 }) category: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) plannedAmount: number;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) actualAmount: number;
  @Column({ type: 'date', default: () => 'CURRENT_DATE' }) date: Date;
  @Column({ type: 'varchar', length: 20 }) entryType: string;
  @Column({ type: 'uuid' }) createdBy: string;
  @Column({ type: 'uuid', nullable: true }) approvedBy: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
''')

write("src/modules/budget/budget.service.ts", '''import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetEntry } from './entities/budget-entry.entity';

@Injectable()
export class BudgetService {
  constructor(@InjectRepository(BudgetEntry) private repo: Repository<BudgetEntry>) {}

  async findAll(projectId: string) {
    return this.repo.find({ where: { projectId }, orderBy: { date: 'DESC' } });
  }

  async getSummary(projectId: string) {
    const entries = await this.repo.find({ where: { projectId } });
    const totalPlanned = entries.reduce((sum, e) => sum + Number(e.plannedAmount), 0);
    const totalActual = entries.reduce((sum, e) => sum + Number(e.actualAmount), 0);
    const income = entries.filter(e => e.entryType === 'income').reduce((sum, e) => sum + Number(e.actualAmount), 0);
    const expense = entries.filter(e => e.entryType === 'expense').reduce((sum, e) => sum + Number(e.actualAmount), 0);
    return { totalPlanned, totalActual, income, expense, variance: totalPlanned - totalActual };
  }

  async create(dto: any) {
    const entry = this.repo.create(dto);
    return this.repo.save(entry);
  }

  async update(id: string, dto: any) {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Budget entry not found');
    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { message: 'Budget entry deleted' };
  }
}
''')

write("src/modules/budget/budget.controller.ts", '''import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Budget')
@Controller('budget')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BudgetController {
  constructor(private readonly service: BudgetService) {}

  @Get() @ApiOperation({ summary: 'List budget entries' })
  findAll(@Param('projectId') projectId: string) { return this.service.findAll(projectId); }

  @Get('summary') @ApiOperation({ summary: 'Get budget summary' })
  getSummary(@Param('projectId') projectId: string) { return this.service.getSummary(projectId); }

  @Post() @ApiOperation({ summary: 'Create budget entry' })
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update budget entry' })
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete budget entry' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
''')

write("src/modules/budget/budget.module.ts", '''import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetEntry } from './entities/budget-entry.entity';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
@Module({ imports: [TypeOrmModule.forFeature([BudgetEntry])], controllers: [BudgetController], providers: [BudgetService] })
export class BudgetModule {}
''')

print("✅ All remaining modules created!")
