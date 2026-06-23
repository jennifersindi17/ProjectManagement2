import { Injectable, NotFoundException } from '@nestjs/common';
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
