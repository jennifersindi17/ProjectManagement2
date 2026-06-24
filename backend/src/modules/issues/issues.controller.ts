import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Issues')
@Controller('issues')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IssuesController {
  constructor(private readonly service: IssuesService) {}

  @Get() @ApiOperation({ summary: 'List issues' })
  findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('projectId') projectId: string, @Query('status') status: string, @Query('severity') severity: string) {
    return this.service.findAll(page || 1, limit || 20, projectId, status, severity);
  }

  @Get(':id') @ApiOperation({ summary: 'Get issue by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create issue' })
  create(@Body() dto: CreateIssueDto, @CurrentUser('id') userId: string) { return this.service.create(dto, userId); }

  @Patch(':id') @ApiOperation({ summary: 'Update issue' })
  update(@Param('id') id: string, @Body() dto: UpdateIssueDto) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete issue' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
