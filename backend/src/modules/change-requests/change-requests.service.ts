import { Injectable, NotFoundException } from '@nestjs/common';
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
