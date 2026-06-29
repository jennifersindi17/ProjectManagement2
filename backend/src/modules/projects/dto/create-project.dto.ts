import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'ERP Implementation' })
  @IsString() name: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ example: 'PT ABC Tbk' })
  @IsOptional() @IsString() clientName?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() clientContact?: string;

  @ApiPropertyOptional({ example: 'ERP Implementation' })
  @IsOptional() @IsString() projectType?: string;

  @ApiPropertyOptional({ enum: ['planning', 'analysis', 'development', 'sit', 'uat', 'go_live', 'support', 'closed'] })
  @IsOptional() @IsEnum(['planning', 'analysis', 'development', 'sit', 'uat', 'go_live', 'support', 'closed']) status?: string;

  @ApiPropertyOptional({ enum: ['critical', 'high', 'medium', 'low'] })
  @IsOptional() @IsEnum(['critical', 'high', 'medium', 'low']) priority?: string;

  @ApiPropertyOptional({ enum: ['green', 'yellow', 'red'] })
  @IsOptional() @IsEnum(['green', 'yellow', 'red']) health?: string;

  @ApiPropertyOptional({ example: 750000000 })
  @IsOptional() @IsNumber() contractValue?: number;

  @ApiPropertyOptional({ example: 500000000 })
  @IsOptional() @IsNumber() budget?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString() startDate?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString() endDate?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() projectManagerId?: string;

  // Edit Project fields
  @ApiPropertyOptional()
  @IsOptional() @IsString() category?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() clientPic?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() projectSponsor?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() deliveryManager?: string;

  @ApiPropertyOptional({ default: 'IDR' })
  @IsOptional() @IsString() currency?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString() targetGoLive?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsArray() tags?: string[];

  @ApiPropertyOptional()
  @IsOptional() @IsArray() labels?: string[];

  @ApiPropertyOptional()
  @IsOptional() @IsString() notes?: string;
}

export class UpdateProjectMembersDto {
  @ApiProperty({ description: 'Array of user IDs to set as team members' })
  @IsArray() @IsString({ each: true }) memberIds: string[];
}
