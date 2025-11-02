import {
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function ApiCreateChurchRole() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create church role',
      description:
        'Create a new role template for churches. Requires admin role.',
    }),
    ApiBearerAuth(),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'Worship Leader',
            description: 'Role name',
          },
          description: {
            type: 'string',
            example: 'Leads worship services',
            description: 'Role description',
          },
        },
        required: ['name'],
      },
    }),
    ApiOkResponse({
      description: 'Church role created successfully',
    }),
    ApiConflictResponse({
      description: 'Role not created',
    }),
    ApiUnauthorizedResponse({
      description:
        'User is not authenticated or not authorized (requires admin role)',
    }),
  );
}

export function ApiGetAllChurchRoles() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all church roles',
      description:
        'Retrieve all church role templates available in the system.',
    }),
    ApiOkResponse({
      description: 'Church roles retrieved successfully',
    }),
  );
}

export function ApiGetChurchRole() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get church role by ID',
      description: 'Retrieve a specific church role template by its ID.',
    }),
    ApiParam({
      name: 'id',
      description: 'Church Role ID',
      type: 'string',
      example: '1',
    }),
    ApiOkResponse({
      description: 'Church role retrieved successfully',
    }),
  );
}

export function ApiUpdateChurchRole() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update church role',
      description: 'Update a church role template by its ID.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'Church Role ID',
      type: 'string',
      example: '1',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'Senior Worship Leader',
          },
          description: {
            type: 'string',
            example: 'Leads and coordinates all worship services',
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Church role updated successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiDeleteChurchRole() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete church role',
      description: 'Delete a church role template by its ID.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'Church Role ID',
      type: 'string',
      example: '1',
    }),
    ApiOkResponse({
      description: 'Church role deleted successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}
