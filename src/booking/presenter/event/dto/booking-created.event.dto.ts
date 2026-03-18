import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

/**
 * ticketing.booking.created 토픽 수신 메시지 DTO
 */
export class BookingCreatedEventDto {
  @IsString()
  eventId!: string;

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
