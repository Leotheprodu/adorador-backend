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
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

// Songs by Band (/bands/:bandId/songs)
export function ApiCreateSong() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create new song',
      description:
        'Create a new song for a specific band. User must be a member of the band.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            example: 'Amazing Grace',
            description: 'Song title',
          },
          artist: {
            type: 'string',
            example: 'John Newton',
            description: 'Song artist/composer',
          },
          key: {
            type: 'string',
            example: 'G',
            description: 'Musical key',
          },
        },
        required: ['title'],
      },
    }),
    ApiCreatedResponse({
      description: 'Song created successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated or not a member of the band',
    }),
    ApiBadRequestResponse({
      description: 'Failed to create song',
    }),
  );
}

export function ApiGetSongsByBand() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all songs from a band',
      description: 'Retrieve all songs belonging to a specific band.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Songs retrieved successfully',
    }),
    ApiNotFoundResponse({
      description: 'No songs found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiGetSong() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get song by ID',
      description: 'Retrieve a specific song by its ID from a band.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Song ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Song retrieved successfully',
    }),
    ApiNotFoundResponse({
      description: 'Song not found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiUpdateSong() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update song',
      description: 'Update a song by its ID.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Song ID',
      type: 'number',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            example: 'Amazing Grace (Updated)',
          },
          artist: {
            type: 'string',
            example: 'John Newton',
          },
          key: {
            type: 'string',
            example: 'A',
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Song updated successfully',
    }),
    ApiNotFoundResponse({
      description: 'Song not found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiDeleteSong() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete song',
      description: 'Delete a song by its ID.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Song ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Song deleted successfully',
      schema: {
        example: {
          message: 'Song deleted',
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Song not deleted',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

// All Songs (/songs)
export function ApiGetAllSongs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all songs (paginated)',
      description: 'Retrieve all songs from all bands with pagination.',
    }),
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'Songs retrieved successfully with pagination',
      schema: {
        example: {
          songs: [],
          total: 100,
          page: 1,
          limit: 10,
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'No songs found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}
