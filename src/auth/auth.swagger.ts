import { ApiBody, ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'Login',
      description: 'Logs in a user and sets the session',
    }),
    ApiOkResponse({
      description: 'User logged in',
      schema: {
        example: {
          id: 0,
          email: 'email@mail.com',
          name: 'user',
          status: 'active',
          createdAt: '2024-05-30T07:53:19.200Z',
          updatedAt: '2024-05-30T07:53:19.200Z',
          isLoggedIn: true,
        },
      },
    }),
    ApiBody({
      type: LoginDto,
      examples: {
        user: {
          value: {
            email: 'user_email@email.com',
            password: 'userPasword1234!',
          },
          summary: 'User email and password',
        },
      },
      required: true,
    }),
  );
}

export function ApiLogout() {
  return applyDecorators(
    ApiOperation({
      summary: 'Logout',
      description: 'Logs out a user and set session isLoggedIn = false',
    }),
    ApiOkResponse({
      description: 'User logged out',
      schema: {
        example: {
          id: 0,
          email: 'email@mail.com',
          name: 'user',
          status: 'incative',
          createdAt: '2024-05-30T07:53:19.200Z',
          updatedAt: '2024-05-30T07:53:19.200Z',
          isLoggedIn: false,
        },
      },
    }),
  );
}
export function ApiVerify() {
  return applyDecorators(
    ApiOperation({
      summary: 'Verify Email',
      description: 'Verifies the email of a user',
    }),
    ApiOkResponse({
      description: 'Email verified',
      schema: {
        example: {
          status: 'active',
        },
      },
    }),
  );
}
