import { Controller, Get, Post, Patch, Delete, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectMembersDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List all projects' })
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('status') status: string,
    @Query('health') health: string,
    @Query('managerId') managerId: string,
    @Query('search') search: string,
  ) {
    return this.service.findAll(page || 1, limit || 20, status, health, managerId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOneWithDetails(id);
  }

  @Get(':id/overview')
  @ApiOperation({ summary: 'Get project overview stats' })
  getOverview(@Param('id') id: string) {
    return this.service.getOverview(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get project members' })
  getMembers(@Param('id') id: string) {
    return this.service.getMembers(id);
  }

  @Put(':id/members')
  @ApiOperation({ summary: 'Update project members' })
  updateMembers(@Param('id') id: string, @Body() dto: UpdateProjectMembersDto) {
    return this.service.updateMembers(id, dto.memberIds);
  }

  @Post()
  @ApiOperation({ summary: 'Create project' })
  create(@Body() dto: CreateProjectDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project' })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
