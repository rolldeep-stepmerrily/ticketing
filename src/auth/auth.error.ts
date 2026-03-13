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
  REFRESH_TOKEN_INVALID: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorCode: 'AUTH_REFRESH_TOKEN_INVALID',
    message: 'Invalid or expired refresh token',
  },
} as const;
