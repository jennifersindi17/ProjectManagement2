import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly service: TasksService) {}

  // === Gantt Chart (must be before :id routes) ===
  @Get('gantt') @ApiOperation({ summary: 'Get Gantt chart data with hierarchy and dependencies' })
  getGanttData(@Query('projectId') projectId: string) {
    return this.service.getGanttData(projectId);
  }

  // === Existing CRUD ===
  @Get() @ApiOperation({ summary: 'List all tasks' })
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('projectId') projectId: string,
    @Query('sprintId') sprintId: string,
    @Query('status') status: string,
    @Query('priority') priority: string,
    @Query('assigneeId') assigneeId: string,
    @Query('search') search: string,
    @Query('dueDateFrom') dueDateFrom: string,
    @Query('dueDateTo') dueDateTo: string,
    @Query('label') label: string,
    @Query('sort') sort: string,
    @Query('order') order: string,
  ) {
    return this.service.findAll(
      page || 1, limit || 20, projectId, sprintId, status,
      priority, assigneeId, search, dueDateFrom, dueDateTo, label, sort, order,
    );
  }

  @Get(':id') @ApiOperation({ summary: 'Get task by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create task' })
  create(@Body() dto: CreateTaskDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Patch(':id') @ApiOperation({ summary: 'Update task' })
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id') @ApiOperation({ summary: 'Delete task' })
  remove(@Param('id') id: string) { return this.service.remove(id); }

  // === Task Center APIs ===

  @Get('center/stats') @ApiOperation({ summary: 'Task center dashboard stats' })
  async getTaskCenterStats(@CurrentUser('id') userId: string) {
    return this.service.getTaskCenterStats(userId);
  }

  @Get('center/kanban') @ApiOperation({ summary: 'Kanban board data' })
  async getKanbanData(
    @Query('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.getKanbanData(projectId, userId);
  }

  @Get('center/calendar') @ApiOperation({ summary: 'Calendar view data' })
  async getCalendarData(
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.getCalendarData(start, end, projectId, userId);
  }

  @Get('center/my-tasks') @ApiOperation({ summary: 'My tasks grouped' })
  async getMyTasks(@CurrentUser('id') userId: string) {
    return this.service.getMyTasks(userId);
  }

  @Get('center/tags') @ApiOperation({ summary: 'All task labels/tags' })
  async getTags(@Query('projectId') projectId: string) {
    return this.service.getTags(projectId);
  }

  @Get('center/reassignable') @ApiOperation({ summary: 'Users eligible for task reassignment' })
  async getReassignableUsers(@CurrentUser('id') userId: string) {
    return this.service.getReassignableUsers(userId);
  }

  // === Bulk Actions ===
  @Patch('bulk/status') @ApiOperation({ summary: 'Bulk update task status' })
  bulkUpdateStatus(@Body() body: { taskIds: string[]; status: string }) {
    return this.service.bulkUpdateStatus(body.taskIds, body.status);
  }

  @Patch('bulk/assign') @ApiOperation({ summary: 'Bulk reassign tasks' })
  bulkAssign(@Body() body: { taskIds: string[]; assigneeId: string }) {
    return this.service.bulkAssign(body.taskIds, body.assigneeId);
  }

  @Delete('bulk/delete') @ApiOperation({ summary: 'Bulk delete tasks' })
  bulkDelete(@Body() body: { taskIds: string[] }) {
    return this.service.bulkDelete(body.taskIds);
  }

  // === Task Detail Extra ===
  @Get(':id/comments') @ApiOperation({ summary: 'Get task comments' })
  getComments(@Param('id') id: string) {
    return this.service.getComments(id);
  }

  @Post(':id/comments') @ApiOperation({ summary: 'Add task comment' })
  addComment(@Param('id') id: string, @Body() body: { content: string }, @CurrentUser('id') userId: string) {
    return this.service.addComment(id, body.content, userId);
  }

  @Get(':id/checklist') @ApiOperation({ summary: 'Get task checklist' })
  getChecklist(@Param('id') id: string) {
    return this.service.getChecklist(id);
  }

  @Post(':id/checklist') @ApiOperation({ summary: 'Add checklist item' })
  addChecklistItem(@Param('id') id: string, @Body() body: { title: string }, @CurrentUser('id') userId: string) {
    return this.service.addChecklistItem(id, body.title, userId);
  }

  @Patch(':id/checklist/:itemId') @ApiOperation({ summary: 'Toggle checklist item' })
  toggleChecklistItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() body: { completed: boolean }) {
    return this.service.toggleChecklistItem(id, itemId, body.completed);
  }

  @Get(':id/activity') @ApiOperation({ summary: 'Get task activity log' })
  getActivityLog(@Param('id') id: string) {
    return this.service.getActivityLog(id);
  }

  @Post(':id/reassign') @ApiOperation({ summary: 'Reassign task' })
  reassign(@Param('id') id: string, @Body() body: { assigneeId: string }, @CurrentUser('id') userId: string) {
    return this.service.reassign(id, body.assigneeId, userId);
  }
}
