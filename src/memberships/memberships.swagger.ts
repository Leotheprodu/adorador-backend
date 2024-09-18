import { ApiBody, ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { CreateMembershipDto } from './dto/create-membership.dto';

export function ApiCreateMembership() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create membership',
      description: 'Create a membership for a user',
    }),
    ApiOkResponse({
      description: 'Membership created',
      schema: {
        example: {
          id: 0,
          userId: 0,
          churchId: 0,
          active: false,
          memberSince: '2024-05-30T07:53:19.200Z',
          createdAt: '2024-05-30T07:53:19.200Z',
          updatedAt: '2024-05-30T07:53:19.200Z',
        },
      },
    }),
    ApiBody({
      type: CreateMembershipDto,
      examples: {
        user: {
          summary: 'Create membership',
          value: {
            churchId: 0,
            active: false,
            memberSince: '2024-05-30T07:53:19.200Z',
          },
        },
      },
      required: true,
    }),
  );
}
