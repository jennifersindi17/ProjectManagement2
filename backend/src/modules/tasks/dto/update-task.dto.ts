import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { IsNumber, IsOptional, Min, Max, IsDateString, IsString, IsArray } from 'class-validator';

export class UpdateTaskDto extends PartialType(
  OmitType(CreateTaskDto, ['projectId'] as const),
) {
  @IsOptional() @IsNumber() @Min(0) @Max(1000) estimatedHours?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1000) actualHours?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) completionPercentage?: number;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() labels?: string[];
}
