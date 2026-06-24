import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TimesheetsService } from './timesheets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Timesheets')
@Controller('timesheets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TimesheetsController {
  constructor(private readonly service: TimesheetsService) {}

  @Get() @ApiOperation({ summary: 'List timesheets' })
  findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('userId') userId: string, @Query('projectId') projectId: string, @Query('status') status: string) {
    return this.service.findAll(page || 1, limit || 20, userId, projectId, status);
  }

  @Get(':id') @ApiOperation({ summary: 'Get timesheet by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create timesheet entry' })
  create(@Body() dto: any, @CurrentUser('id') userId: string) { return this.service.create({ ...dto, userId }); }

  @Patch(':id') @ApiOperation({ summary: 'Update timesheet' })
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Patch(':id/approve') @ApiOperation({ summary: 'Approve timesheet' })
  approve(@Param('id') id: string, @CurrentUser('id') userId: string) { return this.service.approve(id, userId); }

  @Patch(':id/reject') @ApiOperation({ summary: 'Reject timesheet' })
  reject(@Param('id') id: string, @Body('reason') reason: string) { return this.service.reject(id, reason); }

  @Delete(':id') @ApiOperation({ summary: 'Delete timesheet' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
