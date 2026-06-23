import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Get() @ApiOperation({ summary: 'List documents' })
  findAll(@Query('page') page: number, @Query('limit') limit: number, @Query('projectId') projectId: string, @Query('category') category: string, @Query('status') status: string) {
    return this.service.findAll(page || 1, limit || 20, projectId, category, status);
  }

  @Get(':id') @ApiOperation({ summary: 'Get document by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @ApiOperation({ summary: 'Upload document' })
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update document' })
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete document' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
