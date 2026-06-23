import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetEntry } from './entities/budget-entry.entity';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
@Module({ imports: [TypeOrmModule.forFeature([BudgetEntry])], controllers: [BudgetController], providers: [BudgetService] })
export class BudgetModule {}
