import {
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function ApiCreateChord() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create chord for lyric',
      description:
        'Create a new chord notation for a specific lyric section. Maximum 5 chords per lyric.',
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
      name: 'lyricId',
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
            example: 1,
            description: 'Position of the chord in the lyric line (0-4)',
          },
          chord: {
            type: 'string',
            example: 'G',
            description: 'Chord name/notation',
          },
        },
        required: ['position', 'chord'],
      },
    }),
    ApiOkResponse({
      description: 'Chord created successfully',
    }),
    ApiBadRequestResponse({
      description: 'Maximum 5 chords allowed or position already exists',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiGetAllChords() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all chords from a lyric',
      description: 'Retrieve all chord notations for a specific lyric section.',
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
      name: 'lyricId',
      description: 'Lyric ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Chords retrieved successfully',
    }),
    ApiNotFoundResponse({
      description: 'Chords not found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiGetChord() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get chord by ID',
      description: 'Retrieve a specific chord by its ID.',
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
      name: 'lyricId',
      description: 'Lyric ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Chord ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Chord retrieved successfully',
    }),
    ApiNotFoundResponse({
      description: 'Chord not found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiUpdateChord() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update chord',
      description: 'Update a chord notation by its ID.',
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
      name: 'lyricId',
      description: 'Lyric ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Chord ID',
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
          chord: {
            type: 'string',
            example: 'Am',
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Chord updated successfully',
    }),
    ApiNotFoundResponse({
      description: 'Chord not found',
    }),
    ApiBadRequestResponse({
      description: 'Position already exists',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiDeleteChord() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete chord',
      description: 'Delete a chord notation by its ID.',
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
      name: 'lyricId',
      description: 'Lyric ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Chord ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Chord deleted successfully',
      schema: {
        example: {
          message: 'Chord deleted',
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Chord not deleted',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}
