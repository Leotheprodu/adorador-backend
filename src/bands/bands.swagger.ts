import {
  ApiBody,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function ApiGetBands() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all bands',
      description: 'Retrieve a list of all bands in the system.',
    }),
    ApiOkResponse({
      description: 'List of bands retrieved successfully',
      schema: {
        example: [
          {
            id: 1,
            name: 'Worship Band',
            description: 'Main worship band',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    }),
    ApiNotFoundResponse({
      description: 'Bands not found',
    }),
  );
}

export function ApiGetUserBands() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get user bands',
      description:
        'Retrieve all bands that the authenticated user is a member of.',
    }),
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'User bands retrieved successfully',
      schema: {
        example: [
          {
            id: 1,
            role: 'musician',
            isAdmin: false,
            isEventManager: false,
            band: {
              id: 1,
              name: 'Worship Band',
              description: 'Main worship band',
            },
          },
        ],
      },
    }),
    ApiNotFoundResponse({
      description: 'Bands not found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiCreateBand() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create new band',
      description: 'Create a new band. Requires admin role.',
    }),
    ApiBearerAuth(),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'New Worship Band',
            description: 'Band name',
          },
          description: {
            type: 'string',
            example: 'A new worship band for youth services',
            description: 'Band description (optional)',
          },
        },
        required: ['name'],
      },
    }),
    ApiCreatedResponse({
      description: 'Band created successfully',
      schema: {
        example: {
          id: 1,
          name: 'New Worship Band',
          description: 'A new worship band for youth services',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description:
        'User is not authenticated or not authorized (requires admin role)',
    }),
  );
}

export function ApiGetBand() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get band by ID',
      description: 'Retrieve a specific band by its ID.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Band retrieved successfully',
      schema: {
        example: {
          id: 1,
          name: 'Worship Band',
          description: 'Main worship band',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          members: [],
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Band not found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiUpdateBand() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update band by ID',
      description: 'Update band information. Requires admin role.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'Band ID to update',
      type: 'number',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'Updated Band Name',
            description: 'Band name',
          },
          description: {
            type: 'string',
            example: 'Updated description',
            description: 'Band description',
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Band updated successfully',
      schema: {
        example: {
          id: 1,
          name: 'Updated Band Name',
          description: 'Updated description',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T12:00:00.000Z',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Band not found',
    }),
    ApiUnauthorizedResponse({
      description:
        'User is not authenticated or not authorized (requires admin role)',
    }),
  );
}

export function ApiDeleteBand() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete band by ID',
      description: 'Delete a band from the system. Requires admin role.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'Band ID to delete',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Band deleted successfully',
      schema: {
        example: {
          message: 'Band id 1 deleted',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description:
        'User is not authenticated or not authorized (requires admin role)',
    }),
  );
}
