import { Injectable } from '@nestjs/common';
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
