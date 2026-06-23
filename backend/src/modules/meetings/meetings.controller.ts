import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Meetings')
@Controller('meetings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MeetingsController {
  constructor(private readonly service: MeetingsService) {}

  @Get() @ApiOperation({ summary: 'List meetings' })
  findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('projectId') projectId: string) {
    return this.service.findAll(page || 1, limit || 20, projectId);
  }

  @Get(':id') @ApiOperation({ summary: 'Get meeting by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create meeting' })
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update meeting' })
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete meeting' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
