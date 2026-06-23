import { Injectable, NotFoundException } from '@nestjs/common';
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
