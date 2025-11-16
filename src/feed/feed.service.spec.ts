import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from './feed.service';
import { PrismaService } from '../prisma.service';
import { FeedGateway } from './feed.gateway';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PostType, PostStatus, NotificationType } from '@prisma/client';

describe('FeedService', () => {
  let service: FeedService;
  let prismaService: any;
  let feedGateway: any;
  let notificationsService: any;
  let notificationsGateway: any;

  const mockUser = { id: 1, name: 'Test User' };
  const mockBand = { id: 1, name: 'Test Band' };
  const mockSong = {
    id: 1,
    bandId: 1,
    title: 'Test Song',
    artist: 'Test Artist',
    key: 'C',
    tempo: 120,
    songType: 'worship',
  };

  const mockPost = {
    id: 1,
    authorId: 1,
    bandId: 1,
    type: PostType.SONG_REQUEST,
    content: 'Test post',
    status: PostStatus.ACTIVE,
    createdAt: new Date(),
    author: mockUser,
    band: mockBand,
    _count: { blessings: 0, comments: 0, songCopies: 0 },
    blessings: [],
  };

  beforeEach(async () => {
    const mockPrismaService = {
      posts: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      membersofBands: {
        findFirst: jest.fn(),
      },
      songs: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      comments: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
      blessings: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      users: {
        findUnique: jest.fn(),
      },
    };

    const mockFeedGateway = {
      emitNewPost: jest.fn(),
      emitPostUpdated: jest.fn(),
      emitPostDeleted: jest.fn(),
      emitNewComment: jest.fn(),
      emitNewBlessing: jest.fn(),
      emitBlessingRemoved: jest.fn(),
    };

    const mockEventsGateway = {};

    const mockNotificationsService = {
      createNotification: jest.fn(),
      getUnreadCount: jest.fn(),
    };

    const mockNotificationsGateway = {
      emitNotification: jest.fn(),
      emitUnreadCountUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FeedGateway, useValue: mockFeedGateway },
        { provide: EventsGateway, useValue: mockEventsGateway },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: NotificationsGateway, useValue: mockNotificationsGateway },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
    prismaService = module.get(PrismaService);
    feedGateway = module.get(FeedGateway);
    notificationsService = module.get(NotificationsService);
    notificationsGateway = module.get(NotificationsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFeed', () => {
    it('should return paginated feed with posts', async () => {
      const mockPosts = [
        { ...mockPost, id: 1 },
        { ...mockPost, id: 2 },
      ];
      prismaService.posts.findMany.mockResolvedValue(mockPosts);

      const result = await service.getFeed(1, { limit: 20 });

      expect(result).toEqual({
        items: mockPosts.map((p) => ({ ...p, userBlessing: p.blessings })),
        nextCursor: null,
        hasMore: false,
      });
      expect(prismaService.posts.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PostStatus.ACTIVE,
          }),
        }),
      );
    });

    it('should handle pagination with cursor', async () => {
      const mockPosts = Array(21)
        .fill(null)
        .map((_, i) => ({ ...mockPost, id: 21 - i }));
      prismaService.posts.findMany.mockResolvedValue(mockPosts);

      const result = await service.getFeed(1, { limit: 20, cursor: 30 });

      expect(result.hasMore).toBe(true);
      expect(result.items.length).toBe(20);
      expect(result.nextCursor).toBe(2);
    });

    it('should filter by post type', async () => {
      prismaService.posts.findMany.mockResolvedValue([]);

      await service.getFeed(1, { type: 'request', limit: 20 });

      expect(prismaService.posts.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: PostType.SONG_REQUEST,
          }),
        }),
      );
    });
  });

  describe('getPostById', () => {
    it('should return a post by ID', async () => {
      prismaService.posts.findUnique.mockResolvedValue(mockPost);

      const result = await service.getPostById(1, 1);

      expect(result).toEqual({ ...mockPost, userBlessing: mockPost.blessings });
      expect(prismaService.posts.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });

    it('should throw NotFoundException if post does not exist', async () => {
      prismaService.posts.findUnique.mockResolvedValue(null);

      await expect(service.getPostById(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createPost', () => {
    const createPostDto = {
      type: PostType.SONG_REQUEST,
      bandId: 1,
      title: 'New post',
      requestedSongTitle: 'Amazing Grace',
    };
    it('should create a post when user is band member', async () => {
      prismaService.membersofBands.findFirst.mockResolvedValue({
        userId: 1,
        bandId: 1,
        active: true,
      });
      prismaService.posts.create.mockResolvedValue(mockPost);

      const result = await service.createPost(createPostDto, 1);

      expect(result).toBeDefined();
      expect(prismaService.posts.create).toHaveBeenCalled();
      expect(feedGateway.emitNewPost).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 }),
      );
    });

    it('should throw ForbiddenException if user is not band member', async () => {
      prismaService.membersofBands.findFirst.mockResolvedValue(null);

      await expect(service.createPost(createPostDto, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should validate sharedSongId for SONG_SHARE type', async () => {
      const shareDto = {
        type: PostType.SONG_SHARE,
        bandId: 1,
        title: 'Check this song',
        sharedSongId: 1,
      };
      prismaService.membersofBands.findFirst.mockResolvedValue({
        active: true,
      });
      prismaService.songs.findFirst.mockResolvedValue(mockSong);
      prismaService.posts.create.mockResolvedValue(mockPost);

      await service.createPost(shareDto, 1);

      expect(prismaService.songs.findFirst).toHaveBeenCalledWith({
        where: { id: 1, bandId: 1 },
      });
    });

    it('should throw BadRequestException if SONG_SHARE without sharedSongId', async () => {
      const invalidDto = {
        type: PostType.SONG_SHARE,
        bandId: 1,
        title: 'Invalid',
      };
      prismaService.membersofBands.findFirst.mockResolvedValue({
        active: true,
      });

      await expect(service.createPost(invalidDto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updatePost', () => {
    const updateDto = { title: 'Updated title' };

    it('should update post when user is author', async () => {
      prismaService.posts.findUnique.mockResolvedValue(mockPost);
      prismaService.posts.update.mockResolvedValue({
        ...mockPost,
        ...updateDto,
      });

      const result = await service.updatePost(1, updateDto, 1);

      expect(result).toBeDefined();
      expect(feedGateway.emitPostUpdated).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not author', async () => {
      prismaService.posts.findUnique.mockResolvedValue(mockPost);

      await expect(service.updatePost(1, updateDto, 999)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if post does not exist', async () => {
      prismaService.posts.findUnique.mockResolvedValue(null);

      await expect(service.updatePost(999, updateDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deletePost', () => {
    it('should soft delete post when user is author', async () => {
      prismaService.posts.findUnique.mockResolvedValue(mockPost);
      prismaService.posts.update.mockResolvedValue({
        ...mockPost,
        status: PostStatus.DELETED,
      });

      await service.deletePost(1, 1);

      expect(prismaService.posts.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: PostStatus.DELETED },
      });
      expect(feedGateway.emitPostDeleted).toHaveBeenCalledWith(1);
    });

    it('should throw ForbiddenException if user is not author', async () => {
      prismaService.posts.findUnique.mockResolvedValue(mockPost);

      await expect(service.deletePost(1, 999)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('toggleBlessing', () => {
    it('should add blessing if not exists', async () => {
      prismaService.posts.findUnique.mockResolvedValue(mockPost);
      prismaService.blessings.findUnique.mockResolvedValue(null);
      prismaService.blessings.create.mockResolvedValue({ id: 1 });
      prismaService.blessings.count.mockResolvedValue(1);

      const result = await service.toggleBlessing(1, 1);

      expect(result.blessed).toBe(true);
      expect(result.count).toBe(1);
      expect(prismaService.blessings.create).toHaveBeenCalled();
    });

    it('should remove blessing if exists', async () => {
      prismaService.posts.findUnique.mockResolvedValue(mockPost);
      prismaService.blessings.findUnique.mockResolvedValue({ id: 1 });
      prismaService.blessings.delete.mockResolvedValue({ id: 1 });
      prismaService.blessings.count.mockResolvedValue(0);

      const result = await service.toggleBlessing(1, 1);

      expect(result.blessed).toBe(false);
      expect(result.count).toBe(0);
      expect(prismaService.blessings.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if post does not exist', async () => {
      prismaService.posts.findUnique.mockResolvedValue(null);

      await expect(service.toggleBlessing(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createComment', () => {
    const createCommentDto = {
      content: 'Great post!',
    };

    it('should create a comment on a post', async () => {
      const mockComment = {
        id: 1,
        content: 'Great post!',
        postId: 1,
        authorId: 2,
        author: { id: 2, name: 'Commenter' },
      };

      prismaService.posts.findUnique.mockResolvedValue(mockPost);
      prismaService.comments.create.mockResolvedValue(mockComment);
      prismaService.users.findUnique.mockResolvedValue({
        id: 2,
        name: 'Commenter',
      });
      notificationsService.createNotification.mockResolvedValue({
        id: 1,
        type: NotificationType.COMMENT_ON_POST,
      });
      notificationsService.getUnreadCount.mockResolvedValue(1);

      const result = await service.createComment(1, createCommentDto, 2);

      expect(result).toEqual(mockComment);
      expect(feedGateway.emitNewComment).toHaveBeenCalled();
      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        1,
        NotificationType.COMMENT_ON_POST,
        'Nuevo comentario',
        expect.any(String),
        expect.any(Object),
      );
    });

    it('should create a reply to a comment', async () => {
      const replyDto = { content: 'Reply', parentId: 1 };
      const parentComment = { id: 1, postId: 1, authorId: 3 };
      const mockReply = {
        id: 2,
        content: 'Reply',
        postId: 1,
        authorId: 2,
        parentId: 1,
        author: { id: 2, name: 'Replier' },
      };

      prismaService.posts.findUnique.mockResolvedValue(mockPost);
      prismaService.comments.findUnique.mockResolvedValue(parentComment);
      prismaService.comments.create.mockResolvedValue(mockReply);
      prismaService.users.findUnique.mockResolvedValue({
        id: 2,
        name: 'Replier',
      });
      notificationsService.createNotification.mockResolvedValue({
        id: 2,
        type: NotificationType.REPLY_TO_COMMENT,
      });
      notificationsService.getUnreadCount.mockResolvedValue(1);

      await service.createComment(1, replyDto, 2);

      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        3,
        NotificationType.REPLY_TO_COMMENT,
        'Nueva respuesta',
        expect.any(String),
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if post does not exist', async () => {
      prismaService.posts.findUnique.mockResolvedValue(null);

      await expect(
        service.createComment(999, createCommentDto, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if parent comment is invalid', async () => {
      const replyDto = { content: 'Reply', parentId: 999 };
      prismaService.posts.findUnique.mockResolvedValue(mockPost);
      prismaService.comments.findUnique.mockResolvedValue(null);

      await expect(service.createComment(1, replyDto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getComments', () => {
    it('should return paginated comments', async () => {
      const mockComments = [
        {
          id: 1,
          content: 'Comment 1',
          author: mockUser,
          _count: { blessings: 0, songCopies: 0 },
          replies: [],
        },
      ];

      prismaService.posts.findUnique.mockResolvedValue(mockPost);
      prismaService.comments.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);
      prismaService.comments.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockComments);

      const result = await service.getComments(1, { limit: 10 }, 1);

      expect(result.items).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('should throw NotFoundException if post does not exist', async () => {
      prismaService.posts.findUnique.mockResolvedValue(null);

      await expect(service.getComments(999, { limit: 10 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
