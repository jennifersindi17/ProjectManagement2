import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RisksService } from './risks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Risks')
@Controller('risks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RisksController {
  constructor(private readonly service: RisksService) {}

  @Get() @ApiOperation({ summary: 'List risks' })
  findAll(@Param('projectId') projectId: string) { return this.service.findAll(projectId); }

  @Get(':id') @ApiOperation({ summary: 'Get risk by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Create risk' })
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update risk' })
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete risk' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
