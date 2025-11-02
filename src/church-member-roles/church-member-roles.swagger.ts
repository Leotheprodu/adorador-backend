import {
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function ApiCreateMembershipRole() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create role in membership',
      description: 'Assign a church role to a user membership.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'userId',
      description: 'User ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'membershipId',
      description: 'Membership ID',
      type: 'number',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          roleId: {
            type: 'number',
            example: 1,
            description: 'Church Role ID to assign',
          },
        },
        required: ['roleId'],
      },
    }),
    ApiOkResponse({
      description: 'Role assigned to membership successfully',
    }),
    ApiConflictResponse({
      description: 'Role not created',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated or not authorized',
    }),
  );
}

export function ApiGetAllMembershipRoles() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all roles in membership',
      description: 'Retrieve all roles assigned to a specific membership.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'userId',
      description: 'User ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'membershipId',
      description: 'Membership ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Membership roles retrieved successfully',
    }),
    ApiNotFoundResponse({
      description: 'Roles not found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated or not authorized',
    }),
  );
}

export function ApiGetMembershipRole() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get role in membership by ID',
      description: 'Retrieve a specific role assignment in a membership.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'userId',
      description: 'User ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'membershipId',
      description: 'Membership ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Membership Role ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Membership role retrieved successfully',
    }),
    ApiNotFoundResponse({
      description: 'Role not found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated or not authorized',
    }),
  );
}

export function ApiUpdateMembershipRole() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update role in membership',
      description: 'Update a role assignment in a membership.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'userId',
      description: 'User ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'membershipId',
      description: 'Membership ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Membership Role ID',
      type: 'number',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          roleId: {
            type: 'number',
            example: 2,
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Membership role updated successfully',
    }),
    ApiNotFoundResponse({
      description: 'Role not found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated or not authorized',
    }),
  );
}

export function ApiDeleteMembershipRole() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete role from membership',
      description: 'Remove a role assignment from a membership.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'userId',
      description: 'User ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'membershipId',
      description: 'Membership ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Membership Role ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Membership role deleted successfully',
      schema: {
        example: {
          message: 'Role deleted',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Role not found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated or not authorized',
    }),
  );
}
