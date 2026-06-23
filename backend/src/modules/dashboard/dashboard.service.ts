import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { Issue } from '../issues/entities/issue.entity';
import { Risk } from '../risks/entities/risk.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project) private projectsRepo: Repository<Project>,
    @InjectRepository(Task) private tasksRepo: Repository<Task>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Issue) private issuesRepo: Repository<Issue>,
    @InjectRepository(Risk) private risksRepo: Repository<Risk>,
  ) {}

  async getStats() {
    const [totalProjects, activeProjects, totalTasks, completedTasks, totalUsers, openIssues, openRisks] = await Promise.all([
      this.projectsRepo.count({ where: { deletedAt: null } }),
      this.projectsRepo.count({ where: { deletedAt: null, status: 'development' } }),
      this.tasksRepo.count({ where: { deletedAt: null } }),
      this.tasksRepo.count({ where: { deletedAt: null, status: 'done' } }),
      this.usersRepo.count({ where: { deletedAt: null, status: 'active' } }),
      this.issuesRepo.count({ where: { status: 'open' } }),
      this.risksRepo.count({ where: { status: 'identified' } }),
    ]);

    return {
      totalProjects, activeProjects, totalTasks, completedTasks, totalUsers, openIssues, openRisks,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }

  async getProjectDashboard() {
    const projects = await this.projectsRepo.find({ where: { deletedAt: null }, take: 10, orderBy: { createdAt: 'DESC' } });
    return projects;
  }

  async getRecentActivities() {
    const tasks = await this.tasksRepo.find({ where: { deletedAt: null }, take: 10, orderBy: { updatedAt: 'DESC' } });
    return tasks;
  }
}
