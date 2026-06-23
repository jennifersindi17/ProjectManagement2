import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats') @ApiOperation({ summary: 'Get dashboard statistics' })
  getStats() { return this.service.getStats(); }

  @Get('projects') @ApiOperation({ summary: 'Get project dashboard' })
  getProjectDashboard() { return this.service.getProjectDashboard(); }

  @Get('activities') @ApiOperation({ summary: 'Get recent activities' })
  getRecentActivities() { return this.service.getRecentActivities(); }
}
