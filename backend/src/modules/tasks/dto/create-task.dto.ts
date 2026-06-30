import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sprintId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() parentTaskId?: string;
  @ApiProperty({ example: 'Setup database schema' }) @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked'] })
  @IsOptional() @IsEnum(['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked']) status?: string;
  @ApiPropertyOptional({ enum: ['critical', 'high', 'medium', 'low'] })
  @IsOptional() @IsEnum(['critical', 'high', 'medium', 'low']) priority?: string;
  @ApiPropertyOptional({ enum: ['feature', 'bug', 'improvement', 'task', 'epic', 'story', 'subtask'] })
  @IsOptional() @IsEnum(['feature', 'bug', 'improvement', 'task', 'epic', 'story', 'subtask']) taskType?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assigneeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() storyPoints?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() estimatedHours?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) completionPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString({ each: true }) dependsOn?: string[];
}
