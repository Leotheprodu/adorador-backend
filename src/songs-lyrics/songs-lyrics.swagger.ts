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
  ApiConsumes,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function ApiUploadLyricsFile() {
  return applyDecorators(
    ApiOperation({
      summary: 'Upload lyrics with chords from file',
      description:
        'Upload a file containing song lyrics with chord notations. User must be a member of the band.',
    }),
    ApiBearerAuth(),
    ApiConsumes('multipart/form-data'),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'songId',
      description: 'Song ID',
      type: 'number',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Lyrics file with chords',
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Lyrics uploaded successfully',
      schema: {
        example: {
          message: 'Lyrics uploaded',
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'File not uploaded or buffer is undefined',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated or not a member of the band',
    }),
  );
}

export function ApiCreateLyric() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create song lyric',
      description:
        'Create a new lyric section for a song. Each lyric has a position and content.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'songId',
      description: 'Song ID',
      type: 'number',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          position: {
            type: 'number',
            example: 1,
            description: 'Position/order of the lyric section',
          },
          content: {
            type: 'string',
            example: 'Amazing grace, how sweet the sound',
            description: 'Lyric content',
          },
          type: {
            type: 'string',
            example: 'verse',
            description: 'Type of lyric section (verse, chorus, bridge, etc.)',
          },
        },
        required: ['position', 'content'],
      },
    }),
    ApiCreatedResponse({
      description: 'Lyric created successfully',
    }),
    ApiBadRequestResponse({
      description: 'Position already taken or position out of range',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated or not a member of the band',
    }),
  );
}

export function ApiGetAllLyrics() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all lyrics from a song',
      description: 'Retrieve all lyric sections for a specific song.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'songId',
      description: 'Song ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Lyrics retrieved successfully',
    }),
    ApiNotFoundResponse({
      description: 'Lyrics not found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiGetLyric() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get lyric by ID',
      description: 'Retrieve a specific lyric section by its ID.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'songId',
      description: 'Song ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Lyric ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Lyric retrieved successfully',
    }),
    ApiNotFoundResponse({
      description: 'Lyric not found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiUpdateLyric() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update lyric',
      description: 'Update a lyric section by its ID.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'songId',
      description: 'Song ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Lyric ID',
      type: 'number',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          position: {
            type: 'number',
            example: 2,
          },
          content: {
            type: 'string',
            example: 'Updated lyric content',
          },
          type: {
            type: 'string',
            example: 'chorus',
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Lyric updated successfully',
    }),
    ApiNotFoundResponse({
      description: 'Lyric not found',
    }),
    ApiBadRequestResponse({
      description: 'Position already taken',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiNormalizeLyrics() {
  return applyDecorators(
    ApiOperation({
      summary: 'Normalize lyrics',
      description:
        'Apply normalization rules to existing lyrics. This applies the same formatting rules used when uploading from a txt file: lowercase text with first letter capitalized, divine words capitalized, removal of punctuation and special characters at the beginning and end of words.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'songId',
      description: 'Song ID',
      type: 'number',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          lyricIds: {
            type: 'array',
            items: {
              type: 'number',
            },
            example: [1, 2, 3, 4, 5],
            description: 'Array of lyric IDs to normalize',
          },
        },
        required: ['lyricIds'],
      },
    }),
    ApiOkResponse({
      description: 'Lyrics normalized successfully',
      schema: {
        example: {
          message: 'Normalized 5 of 5 lyrics',
          results: {
            success: [1, 2, 3, 4, 5],
            failed: [],
            notFound: [],
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid request body or no lyric IDs provided',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiDeleteLyric() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete lyric',
      description: 'Delete a lyric section by its ID.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'songId',
      description: 'Song ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Lyric ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Lyric deleted successfully',
      schema: {
        example: {
          message: 'Lyric deleted',
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Lyric not deleted',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}
