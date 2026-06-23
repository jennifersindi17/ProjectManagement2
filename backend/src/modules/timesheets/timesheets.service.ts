import { Injectable, NotFoundException } from '@nestjs/common';
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
