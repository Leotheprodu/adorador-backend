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

export function ApiGetChurches() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all churches',
      description: 'Retrieve a list of all churches in the system.',
    }),
    ApiOkResponse({
      description: 'List of churches retrieved successfully',
      schema: {
        example: [
          {
            id: 1,
            name: 'Grace Community Church',
            description: 'A welcoming community church',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    }),
    ApiNotFoundResponse({
      description: 'Churches not found',
    }),
  );
}

export function ApiCreateChurch() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create new church',
      description: 'Create a new church. Requires admin role.',
    }),
    ApiBearerAuth(),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'New Community Church',
            description: 'Church name',
          },
          description: {
            type: 'string',
            example: 'A new community church',
            description: 'Church description (optional)',
          },
        },
        required: ['name'],
      },
    }),
    ApiCreatedResponse({
      description: 'Church created successfully',
      schema: {
        example: {
          id: 1,
          name: 'New Community Church',
          description: 'A new community church',
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

export function ApiGetChurch() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get church by ID',
      description: 'Retrieve a specific church by its ID.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'Church ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Church retrieved successfully',
      schema: {
        example: {
          id: 1,
          name: 'Grace Community Church',
          description: 'A welcoming community church',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          memberships: [],
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Church not found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiUpdateChurch() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update church by ID',
      description: 'Update church information. Requires admin role.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'Church ID to update',
      type: 'number',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'Updated Church Name',
            description: 'Church name',
          },
          description: {
            type: 'string',
            example: 'Updated description',
            description: 'Church description',
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Church updated successfully',
      schema: {
        example: {
          id: 1,
          name: 'Updated Church Name',
          description: 'Updated description',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T12:00:00.000Z',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Church not found',
    }),
    ApiUnauthorizedResponse({
      description:
        'User is not authenticated or not authorized (requires admin role)',
    }),
  );
}

export function ApiDeleteChurch() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete church by ID',
      description: 'Delete a church from the system. Requires admin role.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'Church ID to delete',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Church deleted successfully',
      schema: {
        example: {
          message: 'Church id 1 deleted',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description:
        'User is not authenticated or not authorized (requires admin role)',
    }),
  );
}
