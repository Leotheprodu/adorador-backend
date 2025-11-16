import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: any;

  const mockNotification = {
    id: 1,
    userId: 1,
    type: NotificationType.COMMENT_ON_POST,
    title: 'Nuevo comentario',
    message: 'Alguien comentó en tu publicación',
    read: false,
    metadata: {},
    createdAt: new Date(),
    readAt: null,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      notifications: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const mockNotificationsGateway = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsGateway, useValue: mockNotificationsGateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      prismaService.notifications.create.mockResolvedValue(mockNotification);

      const result = await service.createNotification(
        1,
        NotificationType.COMMENT_ON_POST,
        'Nuevo comentario',
        'Alguien comentó en tu publicación',
        { postId: 1 },
      );

      expect(result).toEqual(mockNotification);
      expect(prismaService.notifications.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          type: NotificationType.COMMENT_ON_POST,
          title: 'Nuevo comentario',
          message: 'Alguien comentó en tu publicación',
          metadata: { postId: 1 },
        },
      });
    });

    it('should create notification without metadata', async () => {
      prismaService.notifications.create.mockResolvedValue(mockNotification);

      await service.createNotification(
        1,
        NotificationType.COMMENT_ON_POST,
        'Test',
        'Test message',
      );

      expect(prismaService.notifications.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: undefined,
        }),
      });
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      const mockNotifications = [
        { ...mockNotification, id: 1 },
        { ...mockNotification, id: 2 },
      ];

      prismaService.notifications.findMany.mockResolvedValue(mockNotifications);
      prismaService.notifications.count.mockResolvedValue(2);

      const result = await service.getNotifications(1, { limit: 20 });

      expect(result).toEqual({
        items: mockNotifications,
        nextCursor: null,
        hasMore: false,
        unreadCount: 2,
      });
    });

    it('should handle pagination with cursor', async () => {
      const mockNotifications = Array(21)
        .fill(null)
        .map((_, i) => ({ ...mockNotification, id: 21 - i }));

      prismaService.notifications.findMany.mockResolvedValue(mockNotifications);
      prismaService.notifications.count.mockResolvedValue(15);

      const result = await service.getNotifications(1, {
        limit: 20,
        cursor: 30,
      });

      expect(result.hasMore).toBe(true);
      expect(result.items.length).toBe(20);
      expect(result.nextCursor).toBe(2);
    });

    it('should filter unread notifications only', async () => {
      const unreadNotifications = [{ ...mockNotification, read: false }];

      prismaService.notifications.findMany.mockResolvedValue(
        unreadNotifications,
      );
      prismaService.notifications.count.mockResolvedValue(1);

      await service.getNotifications(1, { unreadOnly: true, limit: 20 });

      expect(prismaService.notifications.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
            read: false,
          }),
        }),
      );
    });

    it('should limit results to max 50', async () => {
      prismaService.notifications.findMany.mockResolvedValue([]);
      prismaService.notifications.count.mockResolvedValue(0);

      await service.getNotifications(1, { limit: 100 });

      expect(prismaService.notifications.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 51, // 50 + 1 para detectar hasMore
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const unreadNotification = { ...mockNotification, read: false };
      prismaService.notifications.findUnique.mockResolvedValue(
        unreadNotification,
      );
      prismaService.notifications.update.mockResolvedValue({
        ...unreadNotification,
        read: true,
      });

      await service.markAsRead(1, 1);

      expect(prismaService.notifications.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          read: true,
          readAt: expect.any(Date),
        },
      });
    });

    it('should not update if already read', async () => {
      const readNotification = { ...mockNotification, read: true };
      prismaService.notifications.findUnique.mockResolvedValue(
        readNotification,
      );

      await service.markAsRead(1, 1);

      expect(prismaService.notifications.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      prismaService.notifications.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if notification belongs to different user', async () => {
      const otherUserNotification = { ...mockNotification, userId: 2 };
      prismaService.notifications.findUnique.mockResolvedValue(
        otherUserNotification,
      );

      await expect(service.markAsRead(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      prismaService.notifications.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead(1);

      expect(result).toBe(5);
      expect(prismaService.notifications.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          read: false,
        },
        data: {
          read: true,
          readAt: expect.any(Date),
        },
      });
    });

    it('should return 0 if no unread notifications', async () => {
      prismaService.notifications.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.markAllAsRead(1);

      expect(result).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      prismaService.notifications.count.mockResolvedValue(3);

      const result = await service.getUnreadCount(1);

      expect(result).toBe(3);
      expect(prismaService.notifications.count).toHaveBeenCalledWith({
        where: {
          userId: 1,
          read: false,
        },
      });
    });

    it('should return 0 if no unread notifications', async () => {
      prismaService.notifications.count.mockResolvedValue(0);

      const result = await service.getUnreadCount(1);

      expect(result).toBe(0);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      prismaService.notifications.findUnique.mockResolvedValue(
        mockNotification,
      );
      prismaService.notifications.delete.mockResolvedValue(mockNotification);

      await service.deleteNotification(1, 1);

      expect(prismaService.notifications.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      prismaService.notifications.findUnique.mockResolvedValue(null);

      await expect(service.deleteNotification(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if notification belongs to different user', async () => {
      const otherUserNotification = { ...mockNotification, userId: 2 };
      prismaService.notifications.findUnique.mockResolvedValue(
        otherUserNotification,
      );

      await expect(service.deleteNotification(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cleanOldNotifications', () => {
    it('should delete old read notifications', async () => {
      prismaService.notifications.deleteMany.mockResolvedValue({ count: 10 });

      const result = await service.cleanOldNotifications();

      expect(result).toBe(10);
      expect(prismaService.notifications.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date),
          },
          read: true,
        },
      });
    });

    it('should only delete notifications older than 30 days', async () => {
      prismaService.notifications.deleteMany.mockResolvedValue({ count: 5 });

      await service.cleanOldNotifications();

      const deleteCall =
        prismaService.notifications.deleteMany.mock.calls[0][0];
      const thirtyDaysAgo = deleteCall.where.createdAt.lt;
      const now = new Date();
      const diffDays = Math.floor(
        (now.getTime() - thirtyDaysAgo.getTime()) / (1000 * 60 * 60 * 24),
      );

      expect(diffDays).toBeGreaterThanOrEqual(29);
      expect(diffDays).toBeLessThanOrEqual(31);
    });
  });
});
