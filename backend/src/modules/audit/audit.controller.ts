import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'director')
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get() @ApiOperation({ summary: 'List audit logs (Admin only)' })
  findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('userId') userId: string, @Query('entityType') entityType: string, @Query('action') action: string) {
    return this.service.findAll(page || 1, limit || 50, userId, entityType, action);
  }
}
