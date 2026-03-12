import { HttpStatus } from '@nestjs/common';

export const AUTH_ERRORS = {
  EMAIL_ALREADY_EXISTS: {
    statusCode: HttpStatus.CONFLICT,
    errorCode: 'AUTH_EMAIL_ALREADY_EXISTS',
    message: 'Email already exists',
  },
  INVALID_CREDENTIALS: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorCode: 'AUTH_INVALID_CREDENTIALS',
    message: 'Invalid email or password',
  },
} as const;
