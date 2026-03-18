import { JwtGuard } from '@@guards';
import { Module } from '@nestjs/common';
import { CancelTicketCommandHandler } from './application/commands/cancel-ticket.command';
import { ConfirmTicketCommandHandler } from './application/commands/confirm-ticket.command';
import { CreateTicketCommandHandler } from './application/commands/create-ticket.command';
import { MarkOutboxEventPublishedCommandHandler } from './application/commands/mark-outbox-event-published.command';
import { RecordInboxEventCommandHandler } from './application/commands/record-inbox-event.command';
import { CheckInboxEventExistsQueryHandler } from './application/queries/check-inbox-event-exists.query';
import { GetMyBookingsQueryHandler } from './application/queries/get-my-bookings.query';
import { GetPendingOutboxEventsQueryHandler } from './application/queries/get-pending-outbox-events.query';
import { GetSeatQueryHandler } from './application/queries/get-seat.query';
import { GetTicketQueryHandler } from './application/queries/get-ticket.query';
import { CancelBookingUseCase } from './application/use-cases/cancel-booking.use-case';
import { ConfirmBookingUseCase } from './application/use-cases/confirm-booking.use-case';
import { CreateBookingUseCase } from './application/use-cases/create-booking.use-case';
import { GetMyBookingsUseCase } from './application/use-cases/get-my-bookings.use-case';
import { HandleBookingCancelledUseCase } from './application/use-cases/handle-booking-cancelled.use-case';
import { OutboxPublisherService } from './outbox/outbox-publisher.service';
import { BookingEventController } from './presenter/event/booking.event.controller';
import { BookingHttpController } from './presenter/http/booking.http.controller';

@Module({
  controllers: [BookingHttpController, BookingEventController],
  providers: [
    /** query-handlers */
    GetSeatQueryHandler,
    GetMyBookingsQueryHandler,
    GetTicketQueryHandler,
    GetPendingOutboxEventsQueryHandler,
    CheckInboxEventExistsQueryHandler,

    /** command-handlers */
    CreateTicketCommandHandler,
    CancelTicketCommandHandler,
    ConfirmTicketCommandHandler,
    MarkOutboxEventPublishedCommandHandler,
    RecordInboxEventCommandHandler,

    /** use-cases */
    CreateBookingUseCase,
    CancelBookingUseCase,
    GetMyBookingsUseCase,
    ConfirmBookingUseCase,
    HandleBookingCancelledUseCase,

    /** infrastructure */
    OutboxPublisherService,
    JwtGuard,
  ],
})
export class BookingModule {}
