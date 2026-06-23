import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { Issue } from '../issues/entities/issue.entity';
import { Risk } from '../risks/entities/risk.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
@Module({
  imports: [TypeOrmModule.forFeature([Project, Task, User, Issue, Risk])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
