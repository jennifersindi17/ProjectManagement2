import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetEntry } from './entities/budget-entry.entity';

@Injectable()
export class BudgetService {
  constructor(@InjectRepository(BudgetEntry) private repo: Repository<BudgetEntry>) {}

  async findAll(projectId: string) {
    return this.repo.find({ where: { projectId }, order: { date: 'DESC' } });
  }

  async getSummary(projectId: string) {
    const entries = await this.repo.find({ where: { projectId } });
    const totalPlanned = entries.reduce((sum, e) => sum + Number(e.plannedAmount), 0);
    const totalActual = entries.reduce((sum, e) => sum + Number(e.actualAmount), 0);
    const income = entries.filter(e => e.entryType === 'income').reduce((sum, e) => sum + Number(e.actualAmount), 0);
    const expense = entries.filter(e => e.entryType === 'expense').reduce((sum, e) => sum + Number(e.actualAmount), 0);
    return { totalPlanned, totalActual, income, expense, variance: totalPlanned - totalActual };
  }

  async create(dto: any) {
    const entry = this.repo.create(dto);
    return this.repo.save(entry);
  }

  async update(id: string, dto: any) {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Budget entry not found');
    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { message: 'Budget entry deleted' };
  }
}
