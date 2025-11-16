import { Test, TestingModule } from '@nestjs/testing';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';
import { Response } from 'express';
import { PostType } from '@prisma/client';

describe('FeedController', () => {
  let controller: FeedController;
  let service: FeedService;

  const mockFeedService = {
    getFeed: jest.fn(),
    getPostById: jest.fn(),
    createPost: jest.fn(),
    updatePost: jest.fn(),
    deletePost: jest.fn(),
    getComments: jest.fn(),
    createComment: jest.fn(),
    toggleBlessing: jest.fn(),
    copySong: jest.fn(),
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
    roles: [],
    memberships: [],
    membersofBands: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedController],
      providers: [
        {
          provide: FeedService,
          useValue: mockFeedService,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<FeedController>(FeedController);
    service = module.get<FeedService>(FeedService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have FeedService defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFeed', () => {
    it('should return feed data', async () => {
      const mockFeed = {
        items: [],
        nextCursor: null,
        hasMore: false,
      };
      mockFeedService.getFeed.mockResolvedValue(mockFeed);

      const res = mockResponse();
      await controller.getFeed({ limit: 20 }, mockUser, res);

      expect(mockFeedService.getFeed).toHaveBeenCalledWith(1, { limit: 20 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockFeed);
    });

    it('should handle pagination parameters', async () => {
      const paginationDto = { limit: 10, cursor: 5, type: 'request' as any };
      mockFeedService.getFeed.mockResolvedValue({
        items: [],
        nextCursor: null,
        hasMore: false,
      });

      const res = mockResponse();
      await controller.getFeed(paginationDto, mockUser, res);

      expect(mockFeedService.getFeed).toHaveBeenCalledWith(1, paginationDto);
    });
  });

  describe('getPost', () => {
    it('should return a specific post', async () => {
      const mockPost = {
        id: 1,
        content: 'Test post',
        authorId: 1,
      };
      mockFeedService.getPostById.mockResolvedValue(mockPost);

      const res = mockResponse();
      await controller.getPost(1, mockUser, res);

      expect(mockFeedService.getPostById).toHaveBeenCalledWith(1, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockPost);
    });

    it('should work without authenticated user', async () => {
      const mockPost = { id: 1, content: 'Public post' };
      mockFeedService.getPostById.mockResolvedValue(mockPost);

      const res = mockResponse();
      await controller.getPost(1, undefined, res);

      expect(mockFeedService.getPostById).toHaveBeenCalledWith(1, undefined);
    });
  });

  describe('createPost', () => {
    it('should create a new post', async () => {
      const createDto = {
        type: PostType.SONG_REQUEST,
        bandId: 1,
        title: 'New post',
        requestedSongTitle: 'Amazing Grace',
      };
      const mockPost = { id: 1, ...createDto };
      mockFeedService.createPost.mockResolvedValue(mockPost);

      const res = mockResponse();
      await controller.createPost(createDto, mockUser, res);

      expect(mockFeedService.createPost).toHaveBeenCalledWith(createDto, 1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(mockPost);
    });
  });

  describe('updatePost', () => {
    it('should update an existing post', async () => {
      const updateDto = { title: 'Updated title' };
      const mockUpdatedPost = { id: 1, ...updateDto };
      mockFeedService.updatePost.mockResolvedValue(mockUpdatedPost);

      const res = mockResponse();
      await controller.updatePost(1, updateDto, mockUser, res);

      expect(mockFeedService.updatePost).toHaveBeenCalledWith(1, updateDto, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockUpdatedPost);
    });
  });

  describe('deletePost', () => {
    it('should delete a post', async () => {
      mockFeedService.deletePost.mockResolvedValue(undefined);

      const res = mockResponse();
      await controller.deletePost(1, mockUser, res);

      expect(mockFeedService.deletePost).toHaveBeenCalledWith(1, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('getComments', () => {
    it('should return comments for a post', async () => {
      const mockComments = {
        items: [],
        nextCursor: null,
        hasMore: false,
      };
      mockFeedService.getComments.mockResolvedValue(mockComments);

      const res = mockResponse();
      await controller.getComments(1, { limit: 10 }, mockUser, res);

      expect(mockFeedService.getComments).toHaveBeenCalledWith(
        1,
        { limit: 10 },
        1,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockComments);
    });
  });

  describe('createComment', () => {
    it('should create a comment', async () => {
      const createDto = { content: 'Great post!' };
      const mockComment = { id: 1, postId: 1, ...createDto };
      mockFeedService.createComment.mockResolvedValue(mockComment);

      const res = mockResponse();
      await controller.createComment(1, createDto, mockUser, res);

      expect(mockFeedService.createComment).toHaveBeenCalledWith(
        1,
        createDto,
        1,
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(mockComment);
    });
  });

  describe('toggleBlessing', () => {
    it('should toggle blessing on a post', async () => {
      const blessingResult = { blessed: true, count: 1 };
      mockFeedService.toggleBlessing.mockResolvedValue(blessingResult);

      const res = mockResponse();
      await controller.toggleBlessing(1, mockUser, res);

      expect(mockFeedService.toggleBlessing).toHaveBeenCalledWith(1, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(blessingResult);
    });
  });

  describe('copySong', () => {
    it('should copy a song to band', async () => {
      const copyDto = { targetBandId: 2 };
      const mockCopyResponse = { success: true, songId: 3 };
      mockFeedService.copySong.mockResolvedValue(mockCopyResponse);

      const res = mockResponse();
      await controller.copySong(1, copyDto, mockUser, res);

      expect(mockFeedService.copySong).toHaveBeenCalledWith(1, copyDto, 1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(mockCopyResponse);
    });
  });
});
