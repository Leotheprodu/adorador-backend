import { Posts, PostType, PostStatus } from '@prisma/client';

export interface PostWithRelations extends Posts {
  author: {
    id: number;
    name: string;
  };
  band: {
    id: number;
    name: string;
  };
  sharedSong?: {
    id: number;
    title: string;
    artist: string | null;
    key: string | null;
    tempo: number | null;
    songType: string;
  } | null;
  _count: {
    blessings: number;
    comments: number;
    songCopies: number;
  };
  userBlessing?: {
    id: number;
  }[];
}

export interface FeedResponse {
  items: PostWithRelations[];
  nextCursor: number | null;
  hasMore: boolean;
}

export interface CommentsResponse {
  items: CommentWithAuthor[];
  nextCursor: number | null;
  hasMore: boolean;
}

export interface CommentWithAuthor {
  id: number;
  content: string;
  postId: number;
  authorId: number;
  parentId: number | null;
  sharedSongId: number | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    name: string;
  };
  sharedSong?: {
    id: number;
    title: string;
    artist: string | null;
    key: string | null;
    tempo: number | null;
    songType: string;
  } | null;
  _count?: {
    blessings: number;
  };
  blessings?: { id: number }[];
  replies?: CommentWithAuthor[];
}

export interface BlessingResponse {
  blessed: boolean;
  count: number;
}

export interface CopySongResponse {
  success: boolean;
  copiedSong: {
    id: number;
    title: string;
    bandId: number;
  };
}
