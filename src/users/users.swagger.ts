import {
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiParam,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function ApiGetUsers() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all users',
      description:
        'Retrieve a list of all users in the system. Requires authentication.',
    }),
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'List of users retrieved successfully',
      schema: {
        example: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            birthdate: '1990-01-01T00:00:00.000Z',
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            roles: [1, 2],
          },
        ],
      },
    }),
    ApiNotFoundResponse({
      description: 'Users not found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiGetUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get user by ID',
      description:
        'Retrieve a specific user by their ID. Requires authentication and user must be requesting their own data or be an admin.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'User ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'User retrieved successfully',
      schema: {
        example: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          birthdate: '1990-01-01T00:00:00.000Z',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          roles: [
            {
              id: 1,
              name: 'user',
            },
          ],
          memberships: [],
          membersofBands: [],
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'User not found',
    }),
    ApiUnauthorizedResponse({
      description:
        'User is not authenticated or not authorized to view this user',
    }),
  );
}

export function ApiCreateUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create new user',
      description:
        'Register a new user account. Sends a verification email to the provided email address.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'John Doe',
            description: 'User full name',
          },
          email: {
            type: 'string',
            example: 'john@example.com',
            description: 'User email address',
          },
          password: {
            type: 'string',
            example: 'Password123!',
            description: 'User password',
          },
          phone: {
            type: 'string',
            example: '+1234567890',
            description: 'User phone number (optional)',
          },
          birthdate: {
            type: 'string',
            format: 'date-time',
            example: '1990-01-01T00:00:00.000Z',
            description: 'User birthdate (optional)',
          },
        },
        required: ['name', 'email', 'password'],
      },
    }),
    ApiCreatedResponse({
      description: 'User created successfully',
      schema: {
        example: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          birthdate: '1990-01-01T00:00:00.000Z',
          status: 'inactive',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiConflictResponse({
      description: 'Email already exists',
    }),
    ApiBadRequestResponse({
      description: 'Invalid request body',
    }),
  );
}

export function ApiDeleteUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete user by ID',
      description: 'Delete a user from the system. Requires admin role.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'User ID to delete',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'User deleted successfully',
      schema: {
        example: {
          message: 'User id 1 deleted',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description:
        'User is not authenticated or not authorized (requires admin role)',
    }),
  );
}

export function ApiUpdateUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update user by ID',
      description:
        'Update user information. User can only update their own data or must be an admin.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'User ID to update',
      type: 'number',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'John Doe Updated',
            description: 'User full name',
          },
          email: {
            type: 'string',
            example: 'john.updated@example.com',
            description: 'User email address',
          },
          phone: {
            type: 'string',
            example: '+9876543210',
            description: 'User phone number',
          },
          birthdate: {
            type: 'string',
            format: 'date-time',
            example: '1990-01-01T00:00:00.000Z',
            description: 'User birthdate',
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'User updated successfully',
      schema: {
        example: {
          id: 1,
          name: 'John Doe Updated',
          email: 'john.updated@example.com',
          phone: '+9876543210',
          birthdate: '1990-01-01T00:00:00.000Z',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T12:00:00.000Z',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'User not found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated or not authorized',
    }),
  );
}

export function ApiAddUserRole() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add role to user',
      description: 'Assign a role to a user. Requires admin role.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'User ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'roleId',
      description: 'Role ID to assign',
      type: 'number',
      example: 2,
    }),
    ApiOkResponse({
      description: 'Role added successfully',
      schema: {
        example: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          roles: [
            { id: 1, name: 'user' },
            { id: 2, name: 'admin' },
          ],
        },
      },
    }),
    ApiUnauthorizedResponse({
      description:
        'User is not authenticated or not authorized (requires admin role)',
    }),
  );
}

export function ApiRemoveUserRole() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove role from user',
      description: 'Remove a role from a user. Requires admin role.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'User ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'roleId',
      description: 'Role ID to remove',
      type: 'number',
      example: 2,
    }),
    ApiOkResponse({
      description: 'Role removed successfully',
      schema: {
        example: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          roles: [{ id: 1, name: 'user' }],
        },
      },
    }),
    ApiUnauthorizedResponse({
      description:
        'User is not authenticated or not authorized (requires admin role)',
    }),
  );
}
