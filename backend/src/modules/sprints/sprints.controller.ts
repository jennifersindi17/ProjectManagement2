import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SprintsService } from './sprints.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Sprints')
@Controller('sprints')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SprintsController {
  constructor(private readonly service: SprintsService) {}

  @Get() @ApiOperation({ summary: 'List sprints' })
  findAll(@Param('projectId') projectId: string) { return this.service.findAll(projectId); }

  @Get(':id') @ApiOperation({ summary: 'Get sprint by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create sprint' })
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update sprint' })
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete sprint' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
