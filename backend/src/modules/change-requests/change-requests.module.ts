import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChangeRequest } from './entities/change-request.entity';
import { ChangeRequestsService } from './change-requests.service';
import { ChangeRequestsController } from './change-requests.controller';
@Module({ imports: [TypeOrmModule.forFeature([ChangeRequest])], controllers: [ChangeRequestsController], providers: [ChangeRequestsService] })
export class ChangeRequestsModule {}
