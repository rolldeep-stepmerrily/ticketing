import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

/**
 * ticketing.booking.cancelled 토픽 수신 메시지 DTO
 */
export class BookingCancelledEventDto {
  @IsNumber()
  @Type(() => Number)
  ticketId!: number;

  @IsNumber()
  @Type(() => Number)
  userId!: number;

  @IsNumber()
  @Type(() => Number)
  seatId!: number;

  @IsNumber()
  @Type(() => Number)
  concertId!: number;
}
