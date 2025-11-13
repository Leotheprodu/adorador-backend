import { NotificationType } from '@prisma/client';

import { Prisma } from '@prisma/client';

export interface NotificationResponse {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Prisma.JsonValue;
  read: boolean;
  createdAt: Date;
  readAt?: Date | null;
}

export interface NotificationListResponse {
  items: NotificationResponse[];
  nextCursor: number | null;
  hasMore: boolean;
  unreadCount: number;
}
