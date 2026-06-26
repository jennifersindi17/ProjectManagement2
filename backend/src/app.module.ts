import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { SnakeNamingStrategy } from './common/naming.strategy';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { TimesheetsModule } from './modules/timesheets/timesheets.module';
import { IssuesModule } from './modules/issues/issues.module';
import { RisksModule } from './modules/risks/risks.module';
import { ChangeRequestsModule } from './modules/change-requests/change-requests.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { BudgetModule } from './modules/budget/budget.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL') || 'postgresql://projectflow:projectflow_secret_2024@localhost:5432/projectflow',
        autoLoadEntities: true,
        synchronize: false,
        namingStrategy: new SnakeNamingStrategy(),
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    TerminusModule,

    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    SprintsModule,
    TimesheetsModule,
    IssuesModule,
    RisksModule,
    ChangeRequestsModule,
    DocumentsModule,
    MeetingsModule,
    NotificationsModule,
    AuditModule,
    DashboardModule,
    BudgetModule,
  ],
})
export class AppModule {}
