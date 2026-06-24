import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get() @ApiOperation({ summary: 'List notifications' })
  findAll(@CurrentUser('id') userId: string, @Query('page') page: number, @Query('limit') limit: number) {
    return this.service.findAll(userId, page || 1, limit || 20);
  }

  @Get('unread-count') @ApiOperation({ summary: 'Get unread count' })
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.service.getUnreadCount(userId);
  }

  @Patch(':id/read') @ApiOperation({ summary: 'Mark as read' })
  markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.markAsRead(id, userId);
  }

  @Patch('read-all') @ApiOperation({ summary: 'Mark all as read' })
  markAllAsRead(@CurrentUser('id') userId: string) {
    return this.service.markAllAsRead(userId);
  }
}
