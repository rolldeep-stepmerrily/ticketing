import { HttpStatus } from '@nestjs/common';

export const CONCERT_ERRORS = {
  NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'CONCERT_NOT_FOUND',
    message: 'Concert not found',
  },
} as const;
