import { IsEmail, IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'john@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: '+628123456789' })
  @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: ['super_admin', 'director', 'pmo', 'project_manager', 'team_lead', 'developer', 'qa', 'client'] })
  @IsOptional() @IsEnum(['super_admin', 'director', 'pmo', 'project_manager', 'team_lead', 'developer', 'qa', 'client'])
  role?: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional() @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'Senior Developer' })
  @IsOptional() @IsString()
  position?: string;
}
