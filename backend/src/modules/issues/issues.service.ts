import { Injectable, NotFoundException } from '@nestjs/common';
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
