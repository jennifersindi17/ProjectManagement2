import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Get() @ApiOperation({ summary: 'List all tasks' })
  findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('projectId') projectId: string, @Query('sprintId') sprintId: string, @Query('status') status: string, @Query('priority') priority: string, @Query('assigneeId') assigneeId: string, @Query('search') search: string) {
    return this.service.findAll(page || 1, limit || 20, projectId, sprintId, status, priority, assigneeId, search);
  }

  @Get(':id') @ApiOperation({ summary: 'Get task by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create task' })
  create(@Body() dto: CreateTaskDto, @CurrentUser('id') userId: string) { return this.service.create(dto, userId); }

  @Patch(':id') @ApiOperation({ summary: 'Update task' })
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete task' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
