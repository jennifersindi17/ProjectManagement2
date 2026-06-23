import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Risk } from './entities/risk.entity';

@Injectable()
export class RisksService {
  constructor(@InjectRepository(Risk) private repo: Repository<Risk>) {}

  async findAll(projectId: string) {
    return this.repo.find({ where: { projectId }, orderBy: { probability: 'DESC', impact: 'DESC' } });
  }

  async findOne(id: string) {
    const risk = await this.repo.findOne({ where: { id } });
    if (!risk) throw new NotFoundException('Risk not found');
    return risk;
  }

  async create(dto: any) {
    const count = await this.repo.count({ where: { projectId: dto.projectId } });
    const code = `RSK-${String(count + 1).padStart(4, '0')}`;
    const risk = this.repo.create({ ...dto, riskCode: code });
    return this.repo.save(risk);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { message: 'Risk deleted' };
  }
}
