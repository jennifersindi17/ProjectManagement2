import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Budget')
@Controller('budget')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BudgetController {
  constructor(private readonly service: BudgetService) {}

  @Get() @ApiOperation({ summary: 'List budget entries' })
  findAll(@Param('projectId') projectId: string) { return this.service.findAll(projectId); }

  @Get('summary') @ApiOperation({ summary: 'Get budget summary' })
  getSummary(@Param('projectId') projectId: string) { return this.service.getSummary(projectId); }

  @Post() @ApiOperation({ summary: 'Create budget entry' })
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update budget entry' })
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete budget entry' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
