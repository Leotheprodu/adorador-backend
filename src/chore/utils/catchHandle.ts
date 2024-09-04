import { HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export const catchHandle = (e: any) => {
  console.error(e);
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
  } else if (e instanceof Prisma.PrismaClientValidationError) {
    throw new HttpException('Data Validation Error', HttpStatus.BAD_REQUEST);
  } else if (e instanceof HttpException) {
    throw new HttpException(e.getResponse(), e.getStatus());
  } else {
    throw new HttpException(
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
};
