import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from './entities/issue.entity';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';
@Module({ imports: [TypeOrmModule.forFeature([Issue])], controllers: [IssuesController], providers: [IssuesService] })
export class IssuesModule {}
