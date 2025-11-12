import {
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiQuery,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

// GET /feed
export function ApiGetFeed() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get paginated feed of posts',
      description:
        'Retrieve a paginated feed of posts (song requests and shares) using cursor-based pagination. Returns posts from all bands.',
    }),
    ApiBearerAuth(),
    ApiQuery({
      name: 'cursor',
      description: 'ID of the last post seen (for pagination)',
      type: 'number',
      required: false,
      example: 42,
    }),
    ApiQuery({
      name: 'limit',
      description: 'Number of posts per page (max: 50)',
      type: 'number',
      required: false,
      example: 20,
    }),
    ApiQuery({
      name: 'type',
      description: 'Filter by post type',
      enum: ['all', 'request', 'share'],
      required: false,
      example: 'all',
    }),
    ApiOkResponse({
      description: 'Feed retrieved successfully with cursor-based pagination',
      schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                type: { type: 'string', enum: ['SONG_REQUEST', 'SONG_SHARE'] },
                status: {
                  type: 'string',
                  enum: ['ACTIVE', 'RESOLVED', 'DELETED'],
                },
                title: {
                  type: 'string',
                  example: 'Compartiendo "Como en el cielo"',
                },
                description: {
                  type: 'string',
                  example: 'Excelente canción para adoración',
                },
                author: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 1 },
                    name: { type: 'string', example: 'Juan Pérez' },
                  },
                },
                band: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 2 },
                    name: { type: 'string', example: 'Adoradores del Rey' },
                  },
                },
                _count: {
                  type: 'object',
                  properties: {
                    blessings: { type: 'number', example: 15 },
                    comments: { type: 'number', example: 8 },
                    songCopies: { type: 'number', example: 3 },
                  },
                },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
          nextCursor: { type: 'number', nullable: true, example: 42 },
          hasMore: { type: 'boolean', example: true },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

// GET /feed/posts/:postId
export function ApiGetPost() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a specific post by ID',
      description:
        'Retrieve detailed information about a specific post, including author, band, and engagement metrics.',
    }),
    ApiParam({
      name: 'postId',
      description: 'Post ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Post retrieved successfully',
    }),
    ApiNotFoundResponse({
      description: 'Post not found',
    }),
  );
}

// POST /feed/posts
export function ApiCreatePost() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new post',
      description:
        'Create a new post to either request a song (SONG_REQUEST) or share a song from your band (SONG_SHARE). User must be a member of the specified band.',
    }),
    ApiBearerAuth(),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['SONG_REQUEST', 'SONG_SHARE'],
            example: 'SONG_SHARE',
            description: 'Type of post: request or share a song',
          },
          bandId: {
            type: 'number',
            example: 2,
            description: 'ID of your band',
          },
          title: {
            type: 'string',
            example: 'Compartiendo "Como en el cielo"',
            maxLength: 200,
            description: 'Post title',
          },
          description: {
            type: 'string',
            example: 'Excelente canción para adoración',
            description: 'Additional details or context',
          },
          sharedSongId: {
            type: 'number',
            example: 42,
            description: 'ID of the song to share (required for SONG_SHARE)',
          },
          requestedSongTitle: {
            type: 'string',
            example: 'Como en el cielo',
            maxLength: 200,
            description: 'Title of requested song (required for SONG_REQUEST)',
          },
          requestedArtist: {
            type: 'string',
            example: 'Elevation Worship',
            maxLength: 150,
            description: 'Artist of requested song (optional for SONG_REQUEST)',
          },
        },
        required: ['type', 'bandId', 'title'],
      },
    }),
    ApiCreatedResponse({
      description: 'Post created successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
    ApiForbiddenResponse({
      description:
        'User is not a member of the specified band or membership is inactive',
    }),
    ApiBadRequestResponse({
      description:
        'Invalid data: missing required fields for post type or song does not belong to your band',
    }),
    ApiNotFoundResponse({
      description: 'Shared song not found',
    }),
  );
}

// PATCH /feed/posts/:postId
export function ApiUpdatePost() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a post',
      description:
        'Update an existing post. Only the author can edit their posts. Can update title, description, status, and request metadata.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'postId',
      description: 'Post ID',
      type: 'number',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            example: 'Busco "Reckless Love" de Cory Asbury',
            maxLength: 200,
          },
          description: {
            type: 'string',
            example: 'Actualización: preferiblemente en tono de G',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'RESOLVED', 'DELETED'],
            example: 'RESOLVED',
          },
          requestedSongTitle: {
            type: 'string',
            example: 'Reckless Love',
            maxLength: 200,
          },
          requestedArtist: {
            type: 'string',
            example: 'Cory Asbury',
            maxLength: 150,
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Post updated successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
    ApiForbiddenResponse({
      description: 'Only the post author can edit this post',
    }),
    ApiNotFoundResponse({
      description: 'Post not found',
    }),
  );
}

// DELETE /feed/posts/:postId
export function ApiDeletePost() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a post',
      description:
        'Soft delete a post (sets status to DELETED). Only the author can delete their posts. The post will no longer appear in feeds.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'postId',
      description: 'Post ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Post deleted successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Post eliminado exitosamente' },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
    ApiForbiddenResponse({
      description: 'Only the post author can delete this post',
    }),
    ApiNotFoundResponse({
      description: 'Post not found',
    }),
  );
}

// GET /feed/posts/:postId/comments
export function ApiGetComments() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get comments from a post',
      description:
        'Retrieve all comments for a specific post, including nested replies. Comments are ordered by creation date (newest first).',
    }),
    ApiParam({
      name: 'postId',
      description: 'Post ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Comments retrieved successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            content: {
              type: 'string',
              example: 'Tengo esta canción! Te la comparto',
            },
            postId: { type: 'number', example: 1 },
            authorId: { type: 'number', example: 5 },
            parentId: { type: 'number', nullable: true, example: null },
            author: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 5 },
                name: { type: 'string', example: 'María García' },
              },
            },
            replies: {
              type: 'array',
              items: { type: 'object' },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Post not found',
    }),
  );
}

// POST /feed/posts/:postId/comments
export function ApiCreateComment() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a comment on a post',
      description:
        'Add a comment to a post. Optionally specify parentId to reply to another comment (nested replies).',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'postId',
      description: 'Post ID',
      type: 'number',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            example: 'Excelente canción, la tengo en mi banda',
            maxLength: 1000,
            description: 'Comment text',
          },
          parentId: {
            type: 'number',
            example: 5,
            description: 'ID of parent comment (for replies)',
          },
        },
        required: ['content'],
      },
    }),
    ApiCreatedResponse({
      description: 'Comment created successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
    ApiBadRequestResponse({
      description: 'Invalid parent comment ID',
    }),
    ApiNotFoundResponse({
      description: 'Post not found',
    }),
  );
}

// POST /feed/posts/:postId/blessings
export function ApiToggleBlessing() {
  return applyDecorators(
    ApiOperation({
      summary: 'Give or remove blessing from a post',
      description:
        'Toggle a blessing (like) on a post. If the user already blessed it, the blessing is removed. If not, a new blessing is added. Returns the new state and total count.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'postId',
      description: 'Post ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Blessing toggled successfully',
      schema: {
        type: 'object',
        properties: {
          blessed: {
            type: 'boolean',
            example: true,
            description: 'true if user gave blessing, false if removed',
          },
          count: {
            type: 'number',
            example: 16,
            description: 'Total number of blessings on the post',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
    ApiNotFoundResponse({
      description: 'Post not found',
    }),
  );
}

// POST /feed/posts/:postId/copy-song
export function ApiCopySong() {
  return applyDecorators(
    ApiOperation({
      summary: 'Copy a shared song to your band',
      description:
        'Copy a song shared in a SONG_SHARE post to one of your bands. The entire song (including lyrics, chords, and structure) will be duplicated. User must be a member of the target band.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'postId',
      description: 'Post ID (must be a SONG_SHARE post)',
      type: 'number',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          targetBandId: {
            type: 'number',
            example: 3,
            description: 'ID of the band where the song will be copied',
          },
          newKey: {
            type: 'string',
            example: 'A',
            description: 'Optional: Change the key of the copied song',
          },
          newTempo: {
            type: 'number',
            example: 130,
            description: 'Optional: Change the tempo of the copied song',
          },
        },
        required: ['targetBandId'],
      },
    }),
    ApiCreatedResponse({
      description: 'Song copied successfully to your band',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          copiedSong: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 123 },
              title: { type: 'string', example: 'Como en el cielo' },
              bandId: { type: 'number', example: 3 },
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
    ApiForbiddenResponse({
      description:
        'User is not a member of the target band or membership is inactive',
    }),
    ApiBadRequestResponse({
      description:
        'Post is not a SONG_SHARE type, or a song with the same title already exists in your band',
    }),
    ApiNotFoundResponse({
      description: 'Post not found',
    }),
  );
}
