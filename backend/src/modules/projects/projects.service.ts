import { Injectable, NotFoundException } from '@nestjs/common';
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
