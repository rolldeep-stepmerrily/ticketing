import { Module } from '@nestjs/common';

import { JwtGuard } from 'src/common/guards';
import { CancelBookingHandler } from './application/use-cases/cancel-booking/cancel-booking.handler';
import { CreateBookingHandler } from './application/use-cases/create-booking/create-booking.handler';
import { GetMyBookingsHandler } from './application/use-cases/get-my-bookings/get-my-bookings.handler';
import { BookingConfirmConsumer } from './booking-confirm.consumer';
import { BookingHttpController } from './presenter/http/booking.http-controller';

@Module({
  controllers: [BookingHttpController],
  providers: [CreateBookingHandler, CancelBookingHandler, GetMyBookingsHandler, BookingConfirmConsumer, JwtGuard],
})
export class BookingModule {}
