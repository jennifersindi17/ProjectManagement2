#!/usr/bin/env python3
"""Generate all remaining NestJS backend files for ProjectFlow 2.0"""

import os

BASE = "/Users/jenjen/projectflow2/backend"

def write(rel_path, content):
    full = os.path.join(BASE, rel_path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w') as f:
        f.write(content)
    print(f"  ✓ {rel_path}")

# ============================================
# USERS MODULE
# ============================================
write("src/modules/users/dto/create-user.dto.ts", '''import { IsEmail, IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'john@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: '+628123456789' })
  @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: ['super_admin', 'director', 'pmo', 'project_manager', 'team_lead', 'developer', 'qa', 'client'] })
  @IsOptional() @IsEnum(['super_admin', 'director', 'pmo', 'project_manager', 'team_lead', 'developer', 'qa', 'client'])
  role?: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional() @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'Senior Developer' })
  @IsOptional() @IsString()
  position?: string;
}
''')

write("src/modules/users/dto/update-user.dto.ts", '''import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
export class UpdateUserDto extends PartialType(CreateUserDto) {}
''')

write("src/modules/users/users.service.ts", '''import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async findAll(page = 1, limit = 20, role?: string, status?: string, search?: string) {
    const qb = this.repo.createQueryBuilder('u').where('u.deletedAt IS NULL');
    if (role) qb.andWhere('u.role = :role', { role });
    if (status) qb.andWhere('u.status = :status', { status });
    if (search) qb.andWhere('(u.firstName ILIKE :s OR u.lastName ILIKE :s OR u.email ILIKE :s)', { s: `%${search}%` });
    qb.orderBy('u.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const user = await this.repo.findOne({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');
    const { password, ...rest } = user as any;
    return rest;
  }

  async create(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.repo.create({ ...dto, password: hashedPassword, status: 'active' });
    const saved = await this.repo.save(user);
    const { password, ...rest } = saved as any;
    return rest;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (dto.password) dto.password = await bcrypt.hash(dto.password, 10);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.update(id, { deletedAt: new Date() });
    return { message: 'User deleted' };
  }
}
''')

write("src/modules/users/users.controller.ts", '''import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('role') role: string, @Query('status') status: string, @Query('search') search: string) {
    return this.service.findAll(page || 1, limit || 20, role, status, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create user (Admin only)' })
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
''')

write("src/modules/users/users.module.ts", '''import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
''')

# ============================================
# PROJECTS MODULE
# ============================================
write("src/modules/projects/entities/project.entity.ts", '''import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 20, unique: true }) code: string;
  @Column({ type: 'varchar', length: 255 }) name: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) clientName: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) clientContact: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) projectType: string;
  @Column({ type: 'enum', enum: ['planning', 'analysis', 'development', 'sit', 'uat', 'go_live', 'support', 'closed', 'on_hold', 'cancelled'], default: 'planning' }) status: string;
  @Column({ type: 'enum', enum: ['critical', 'high', 'medium', 'low'], default: 'medium' }) priority: string;
  @Column({ type: 'enum', enum: ['green', 'yellow', 'red'], default: 'green' }) health: string;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) contractValue: number;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) budget: number;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) actualCost: number;
  @Column({ type: 'date', nullable: true }) startDate: Date;
  @Column({ type: 'date', nullable: true }) endDate: Date;
  @Column({ type: 'date', nullable: true }) actualStartDate: Date;
  @Column({ type: 'date', nullable: true }) actualEndDate: Date;
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 }) completionPercentage: number;
  @Column({ type: 'uuid', nullable: true }) projectManagerId: string;
  @Column({ type: 'uuid' }) createdBy: string;
  @Column({ type: 'varchar', length: 500, nullable: true }) coverImageUrl: string;
  @Column({ type: 'jsonb', default: {} }) metadata: any;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt: Date;
}
''')

write("src/modules/projects/dto/create-project.dto.ts", '''import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'ERP Implementation' })
  @IsString() name: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ example: 'PT ABC Tbk' })
  @IsOptional() @IsString() clientName?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() clientContact?: string;

  @ApiPropertyOptional({ example: 'ERP Implementation' })
  @IsOptional() @IsString() projectType?: string;

  @ApiPropertyOptional({ enum: ['planning', 'analysis', 'development', 'sit', 'uat', 'go_live', 'support', 'closed'] })
  @IsOptional() @IsEnum(['planning', 'analysis', 'development', 'sit', 'uat', 'go_live', 'support', 'closed']) status?: string;

  @ApiPropertyOptional({ enum: ['critical', 'high', 'medium', 'low'] })
  @IsOptional() @IsEnum(['critical', 'high', 'medium', 'low']) priority?: string;

  @ApiPropertyOptional({ enum: ['green', 'yellow', 'red'] })
  @IsOptional() @IsEnum(['green', 'yellow', 'red']) health?: string;

  @ApiPropertyOptional({ example: 750000000 })
  @IsOptional() @IsNumber() contractValue?: number;

  @ApiPropertyOptional({ example: 500000000 })
  @IsOptional() @IsNumber() budget?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString() startDate?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString() endDate?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() projectManagerId?: string;
}
''')

write("src/modules/projects/dto/update-project.dto.ts", '''import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
''')

write("src/modules/projects/projects.service.ts", '''import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(@InjectRepository(Project) private repo: Repository<Project>) {}

  async findAll(page = 1, limit = 20, status?: string, health?: string, managerId?: string, search?: string) {
    const qb = this.repo.createQueryBuilder('p').where('p.deletedAt IS NULL');
    if (status) qb.andWhere('p.status = :status', { status });
    if (health) qb.andWhere('p.health = :health', { health });
    if (managerId) qb.andWhere('p.projectManagerId = :mid', { mid: managerId });
    if (search) qb.andWhere('(p.name ILIKE :s OR p.clientName ILIKE :s OR p.code ILIKE :s)', { s: `%${search}%` });
    qb.orderBy('p.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const project = await this.repo.findOne({ where: { id, deletedAt: null } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(dto: CreateProjectDto, userId: string) {
    const count = await this.repo.count();
    const code = `PRJ-${String(count + 1).padStart(4, '0')}`;
    const project = this.repo.create({ ...dto, code, createdBy: userId });
    return this.repo.save(project);
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.update(id, { deletedAt: new Date() });
    return { message: 'Project deleted' };
  }
}
''')

write("src/modules/projects/projects.controller.ts", '''import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List all projects' })
  findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('status') status: string, @Query('health') health: string, @Query('managerId') managerId: string, @Query('search') search: string) {
    return this.service.findAll(page || 1, limit || 20, status, health, managerId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create project' })
  create(@Body() dto: CreateProjectDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project' })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
''')

write("src/modules/projects/projects.module.ts", '''import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Project])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
''')

print("✅ Users + Projects modules created")
