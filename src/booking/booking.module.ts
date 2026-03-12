import { Module } from '@nestjs/common';

import { JwtGuard } from 'src/common/guards';
import { CancelTicketCommandHandler } from './application/commands/cancel-ticket.command';
import { CreateTicketCommandHandler } from './application/commands/create-ticket.command';
import { GetMyBookingsQueryHandler } from './application/queries/get-my-bookings.query';
import { GetSeatQueryHandler } from './application/queries/get-seat.query';
import { CancelBookingUseCase } from './application/use-cases/cancel-booking.use-case';
import { CreateBookingUseCase } from './application/use-cases/create-booking.use-case';
import { GetMyBookingsUseCase } from './application/use-cases/get-my-bookings.use-case';
import { BookingConfirmConsumer } from './booking-confirm.consumer';
import { OutboxPublisherService } from './outbox/outbox-publisher.service';
import { BookingHttpController } from './presenter/http/booking.http.controller';

@Module({
  controllers: [BookingHttpController],
  providers: [
    /** query-handlers */
    GetSeatQueryHandler,
    GetMyBookingsQueryHandler,

    /** command-handlers */
    CreateTicketCommandHandler,
    CancelTicketCommandHandler,

    /** use-cases */
    CreateBookingUseCase,
    CancelBookingUseCase,
    GetMyBookingsUseCase,

    BookingConfirmConsumer,
    OutboxPublisherService,
    JwtGuard,
  ],
})
export class BookingModule {}
