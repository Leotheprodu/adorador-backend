import {
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiAcceptedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'User login',
      description:
        'Authenticate user with email and password. Returns access token, refresh token, and user data.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            example: 'user@example.com',
            description: 'User email address',
          },
          password: {
            type: 'string',
            example: 'Password123!',
            description: 'User password',
          },
        },
        required: ['email', 'password'],
      },
    }),
    ApiAcceptedResponse({
      description: 'Login successful. Returns user data and JWT tokens.',
      schema: {
        example: {
          id: 1,
          name: 'John Doe',
          email: 'user@example.com',
          phone: '+1234567890',
          birthdate: '1990-01-01T00:00:00.000Z',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          roles: [1, 2],
          memberships: [],
          membersofBands: [],
          isLoggedIn: true,
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid credentials',
    }),
    ApiBadRequestResponse({
      description: 'Invalid request body',
    }),
  );
}

export function ApiCheckLoginStatus() {
  return applyDecorators(
    ApiOperation({
      summary: 'Check login status',
      description:
        'Verify if the current user is authenticated and return user information.',
    }),
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'User is authenticated. Returns user data.',
      schema: {
        example: {
          id: 1,
          isLoggedIn: true,
          name: 'John Doe',
          email: 'user@example.com',
          roles: [1, 2],
          memberships: [],
          membersofBands: [],
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiLogout() {
  return applyDecorators(
    ApiOperation({
      summary: 'User logout',
      description: 'Logout user and invalidate refresh token in database.',
    }),
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'Logout successful',
      schema: {
        example: {
          id: 1,
          isLoggedIn: false,
          message: 'Logged out successfully',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiRefreshToken() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refresh access token',
      description:
        'Generate a new access token and refresh token using a valid refresh token.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          refreshToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            description: 'Valid refresh token',
          },
        },
        required: ['refreshToken'],
      },
    }),
    ApiOkResponse({
      description: 'Tokens refreshed successfully',
      schema: {
        example: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid refresh token',
    }),
  );
}

export function ApiVerifyEmail() {
  return applyDecorators(
    ApiOperation({
      summary: 'Verify user email',
      description:
        'Verify user email using the verification token sent to their email address.',
    }),
    ApiOkResponse({
      description: 'Email verified successfully',
      schema: {
        example: {
          status: 'active',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid or expired token',
    }),
    ApiNotFoundResponse({
      description: 'User not found',
    }),
  );
}

export function ApiForgotPassword() {
  return applyDecorators(
    ApiOperation({
      summary: 'Request password reset',
      description: 'Send a password reset email to the user.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            example: 'user@example.com',
            description: 'User email address',
          },
        },
        required: ['email'],
      },
    }),
    ApiAcceptedResponse({
      description: 'Password reset email sent successfully',
      schema: {
        example: {
          status: 'success',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'User not found',
    }),
  );
}

export function ApiNewPassword() {
  return applyDecorators(
    ApiOperation({
      summary: 'Set new password',
      description: 'Set a new password using the reset token sent via email.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            example: 'abc123...',
            description: 'Password reset token',
          },
          password: {
            type: 'string',
            example: 'NewPassword123!',
            description: 'New password',
          },
        },
        required: ['token', 'password'],
      },
    }),
    ApiAcceptedResponse({
      description: 'Password updated successfully',
      schema: {
        example: {
          status: 'success',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid or expired token',
    }),
  );
}
