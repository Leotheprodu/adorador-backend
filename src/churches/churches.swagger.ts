import { ApiBody, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function ApiGetChurches() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get churches',
      description: 'Get all Churches',
    }),
    ApiOkResponse({
      description: 'Get all churches',
      schema: {
        example: {
          id: 0,
        },
      },
    }),
  );
}
