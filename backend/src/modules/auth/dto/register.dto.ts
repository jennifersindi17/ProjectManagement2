import { IsEmail, IsEnum, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  TEAM_LEAD = 'team_lead',
  DEVELOPER = 'developer',
  QA = 'qa',
  VIEWER = 'viewer',
}

export class RegisterDto {
  @ApiProperty({ example: 'john.doe@projectflow.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecureP@ss1', description: 'User password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: 'developer', enum: UserRole, description: 'User role', default: 'developer' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: 'Engineering', description: 'Department name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;
}
