import { Injectable, NotFoundException } from '@nestjs/common';
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
