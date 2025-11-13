import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationType } from '@prisma/client';
import {
  NotificationResponse,
  NotificationListResponse,
} from './interfaces/notification.interface';
import { NotificationPaginationDto } from './dto/pagination.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Crear una nueva notificación
   */
  async createNotification(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any,
  ): Promise<NotificationResponse> {
    const notification = await this.prisma.notifications.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata,
      },
    });

    this.logger.log(
      `Notificación creada para usuario ${userId}: ${type} - ${title}`,
    );

    return notification;
  }

  /**
   * Obtener notificaciones paginadas
   */
  async getNotifications(
    userId: number,
    paginationDto: NotificationPaginationDto,
  ): Promise<NotificationListResponse> {
    const { cursor, limit = 20, unreadOnly = false } = paginationDto;

    const validLimit = Math.min(Math.max(limit, 1), 50);

    const where = {
      userId,
      ...(unreadOnly && { read: false }),
      ...(cursor && { id: { lt: cursor } }),
    };

    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notifications.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: validLimit + 1,
      }),
      this.prisma.notifications.count({
        where: { userId, read: false },
      }),
    ]);

    const hasMore = notifications.length > validLimit;
    const items = hasMore ? notifications.slice(0, -1) : notifications;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
      unreadCount,
    };
  }

  /**
   * Marcar una notificación como leída
   */
  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const notification = await this.prisma.notifications.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notificación con ID ${notificationId} no encontrada`,
      );
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notificación no encontrada');
    }

    if (!notification.read) {
      await this.prisma.notifications.update({
        where: { id: notificationId },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      this.logger.log(
        `Usuario ${userId} marcó notificación ${notificationId} como leída`,
      );
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(userId: number): Promise<number> {
    const result = await this.prisma.notifications.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    this.logger.log(
      `Usuario ${userId} marcó ${result.count} notificaciones como leídas`,
    );

    return result.count;
  }

  /**
   * Obtener contador de notificaciones no leídas
   */
  async getUnreadCount(userId: number): Promise<number> {
    return this.prisma.notifications.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  /**
   * Eliminar una notificación
   */
  async deleteNotification(
    notificationId: number,
    userId: number,
  ): Promise<void> {
    const notification = await this.prisma.notifications.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notificación con ID ${notificationId} no encontrada`,
      );
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notificación no encontrada');
    }

    await this.prisma.notifications.delete({
      where: { id: notificationId },
    });

    this.logger.log(`Usuario ${userId} eliminó notificación ${notificationId}`);
  }

  /**
   * Eliminar notificaciones antiguas (más de 30 días)
   */
  async cleanOldNotifications(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.notifications.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
        read: true,
      },
    });

    this.logger.log(`Eliminadas ${result.count} notificaciones antiguas`);

    return result.count;
  }
}
