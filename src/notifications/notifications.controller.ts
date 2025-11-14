import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CheckLoginStatus } from '../auth/decorators/permissions.decorators';
import { NotificationPaginationDto } from './dto/pagination.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { catchHandle } from 'src/chore/utils/catchHandle';
import { Response } from 'express';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @CheckLoginStatus('loggedIn')
  @ApiOperation({ summary: 'Obtener notificaciones del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones' })
  @ApiQuery({ name: 'cursor', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  async getNotifications(
    @GetUser() user: { sub: number },
    @Query() paginationDto: NotificationPaginationDto,
  ) {
    const userId = user.sub;

    return this.notificationsService.getNotifications(userId, paginationDto);
  }

  @Get('unread-count')
  @CheckLoginStatus('loggedIn')
  @ApiOperation({ summary: 'Obtener contador de notificaciones no leídas' })
  @ApiResponse({ status: 200, description: 'Contador de notificaciones' })
  async getUnreadCount(@GetUser() user: { sub: number }) {
    const userId = user.sub;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  @CheckLoginStatus('loggedIn')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Notificación marcada como leída' })
  async markAsRead(
    @Param('id') notificationId: string,
    @GetUser() user: { sub: number },
    @Res() res: Response,
  ) {
    const userId = user.sub;
    try {
      await this.notificationsService.markAsRead(+notificationId, userId);
      res
        .status(HttpStatus.OK)
        .send({ message: 'Notificación marcada como leída' });
    } catch (e) {
      catchHandle(e);
    }
  }

  @Patch('read-all')
  @CheckLoginStatus('loggedIn')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  @ApiResponse({
    status: 200,
    description: 'Notificaciones marcadas como leídas',
  })
  async markAllAsRead(@GetUser() user: { sub: number }) {
    const userId = user.sub;
    const count = await this.notificationsService.markAllAsRead(userId);
    return { count };
  }

  @Delete(':id')
  @CheckLoginStatus('loggedIn')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una notificación' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Notificación eliminada' })
  async deleteNotification(
    @Param('id') notificationId: string,
    @GetUser() user: { sub: number },
  ) {
    const userId = user.sub;
    await this.notificationsService.deleteNotification(+notificationId, userId);
  }
}
