import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sprint } from './entities/sprint.entity';
import { SprintsService } from './sprints.service';
import { SprintsController } from './sprints.controller';
@Module({ imports: [TypeOrmModule.forFeature([Sprint])], controllers: [SprintsController], providers: [SprintsService] })
export class SprintsModule {}
