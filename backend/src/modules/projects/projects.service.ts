import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private repo: Repository<Project>,
  ) {}

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

  async findOneWithDetails(id: string) {
    const project = await this.repo.findOne({ where: { id, deletedAt: null } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async getOverview(id: string) {
    const result = await this.repo.query('SELECT * FROM project_dashboard WHERE id = $1', [id]);
    if (!result || result.length === 0) throw new NotFoundException('Project not found');
    return result[0];
  }

  async create(dto: any, userId: string) {
    const count = await this.repo.count();
    const code = `PRJ-${String(count + 1).padStart(4, '0')}`;
    const project = this.repo.create({ ...dto, code, createdBy: userId });
    return this.repo.save(project);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);

    // Store label_jsonb if labels provided
    if (dto.labels !== undefined) {
      dto.labelsJsonb = dto.labels;
      delete dto.labels;
    }

    // Pick only defined fields to send partial update
    const cleanDto: any = {};
    for (const key of Object.keys(dto)) {
      if (dto[key] !== undefined) cleanDto[key] = dto[key];
    }

    await this.repo.update(id, cleanDto);
    return this.findOne(id);
  }

  async getMembers(projectId: string) {
    const rows = await this.repo.query(
      `SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.allocation_percentage, pm.hourly_rate, pm.joined_at,
              u.first_name, u.last_name, u.email, u.avatar_url, u.role as user_role
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1::uuid AND pm.left_at IS NULL
       ORDER BY pm.role, u.first_name`,
      [projectId],
    );
    return rows;
  }

  async updateMembers(projectId: string, memberIds: string[]) {
    // Remove existing members not in new list
    await this.repo.query(
      `UPDATE project_members SET left_at = NOW() WHERE project_id = $1::uuid AND user_id != ALL($2::uuid[]) AND left_at IS NULL`,
      [projectId, memberIds],
    );

    // Add new members
    for (const userId of memberIds) {
      await this.repo.query(
        `INSERT INTO project_members (id, project_id, user_id, role, joined_at)
         VALUES (uuid_generate_v4(), $1::uuid, $2::uuid, 'member', NOW())
         ON CONFLICT (project_id, user_id) DO UPDATE SET left_at = NULL`,
        [projectId, userId],
      );
    }

    return this.getMembers(projectId);
  }

  async remove(id: string) {
    await this.repo.update(id, { deletedAt: new Date() } as any);
    return { message: 'Project deleted' };
  }
}
