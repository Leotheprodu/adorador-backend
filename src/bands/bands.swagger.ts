import { ApiBody, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function ApiGetBands() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get bands',
      description: 'Get all Bands',
    }),
    ApiOkResponse({
      description: 'Get all bands',
      schema: {
        example: {
          id: 0,
        },
      },
    }),
  );
}
