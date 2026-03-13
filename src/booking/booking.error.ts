import { HttpStatus } from '@nestjs/common';

export const BOOKING_ERRORS = {
  SEAT_NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'BOOKING_SEAT_NOT_FOUND',
    message: 'Seat not found',
  },
  SEAT_NOT_AVAILABLE: {
    statusCode: HttpStatus.CONFLICT,
    errorCode: 'BOOKING_SEAT_NOT_AVAILABLE',
    message: 'Seat is not available',
  },
  BOOKING_IN_PROGRESS: {
    statusCode: HttpStatus.CONFLICT,
    errorCode: 'BOOKING_IN_PROGRESS',
    message: 'Booking is already in progress for this seat',
  },
  TICKET_NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'BOOKING_TICKET_NOT_FOUND',
    message: 'Ticket not found',
  },
  TICKET_NOT_CANCELLABLE: {
    statusCode: HttpStatus.CONFLICT,
    errorCode: 'BOOKING_TICKET_NOT_CANCELLABLE',
    message: 'Ticket cannot be cancelled',
  },
} as const;
