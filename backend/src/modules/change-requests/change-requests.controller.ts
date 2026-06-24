import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChangeRequestsService } from './change-requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Change Requests')
@Controller('change-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChangeRequestsController {
  constructor(private readonly service: ChangeRequestsService) {}

  @Get() @ApiOperation({ summary: 'List change requests' })
  findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('projectId') projectId: string, @Query('status') status: string) {
    return this.service.findAll(page || 1, limit || 20, projectId, status);
  }

  @Get(':id') @ApiOperation({ summary: 'Get change request by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create change request' })
  create(@Body() dto: any, @CurrentUser('id') userId: string) { return this.service.create(dto, userId); }

  @Patch(':id') @ApiOperation({ summary: 'Update change request' })
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete change request' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
