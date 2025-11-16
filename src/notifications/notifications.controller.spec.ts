import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';
import { Response } from 'express';
import { NotificationType } from '@prisma/client';

// Mock relativo para evitar problemas de resolución de módulos en Jest
jest.mock('../chore/utils/catchHandle', () => ({
  catchHandle: jest.fn(),
}));

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotificationsService = {
    getNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
  };

  const mockResponse = () => {
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    return res as Response;
  };

  const mockUser = {
    sub: 1,
    email: 'test@test.com',
    name: 'Test User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have NotificationsService defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNotifications', () => {
    it('should return notifications list', async () => {
      const mockNotifications = {
        items: [
          {
            id: 1,
            userId: 1,
            type: NotificationType.COMMENT_ON_POST,
            title: 'Test',
            message: 'Test message',
            read: false,
            createdAt: new Date(),
          },
        ],
        nextCursor: null,
        hasMore: false,
        unreadCount: 1,
      };

      mockNotificationsService.getNotifications.mockResolvedValue(
        mockNotifications,
      );

      const result = await controller.getNotifications(mockUser, {
        limit: 20,
      });

      expect(mockNotificationsService.getNotifications).toHaveBeenCalledWith(
        1,
        { limit: 20 },
      );
      expect(result).toEqual(mockNotifications);
    });

    it('should handle pagination parameters', async () => {
      const paginationDto = {
        cursor: 5,
        limit: 10,
        unreadOnly: true,
      };

      mockNotificationsService.getNotifications.mockResolvedValue({
        items: [],
        nextCursor: null,
        hasMore: false,
        unreadCount: 0,
      });

      await controller.getNotifications(mockUser, paginationDto);

      expect(mockNotificationsService.getNotifications).toHaveBeenCalledWith(
        1,
        paginationDto,
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockNotificationsService.getUnreadCount.mockResolvedValue(5);

      const result = await controller.getUnreadCount(mockUser);

      expect(mockNotificationsService.getUnreadCount).toHaveBeenCalledWith(1);
      expect(result).toEqual({ count: 5 });
    });

    it('should return 0 when no unread notifications', async () => {
      mockNotificationsService.getUnreadCount.mockResolvedValue(0);

      const result = await controller.getUnreadCount(mockUser);

      expect(result).toEqual({ count: 0 });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockNotificationsService.markAsRead.mockResolvedValue(undefined);

      const res = mockResponse();
      await controller.markAsRead('1', mockUser, res);

      expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith(1, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Notificación marcada como leída',
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockNotificationsService.markAllAsRead.mockResolvedValue(5);

      const result = await controller.markAllAsRead(mockUser);

      expect(mockNotificationsService.markAllAsRead).toHaveBeenCalledWith(1);
      expect(result).toEqual({ count: 5 });
    });

    it('should handle case when no notifications to mark', async () => {
      mockNotificationsService.markAllAsRead.mockResolvedValue(0);

      const result = await controller.markAllAsRead(mockUser);

      expect(result).toEqual({ count: 0 });
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      mockNotificationsService.deleteNotification.mockResolvedValue(undefined);

      await controller.deleteNotification('1', mockUser);

      expect(mockNotificationsService.deleteNotification).toHaveBeenCalledWith(
        1,
        1,
      );
    });
  });
});
