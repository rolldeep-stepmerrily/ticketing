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
  readonly ticketId!: number;

  @IsNumber()
  @Type(() => Number)
  readonly userId!: number;

  @IsNumber()
  @Type(() => Number)
  readonly seatId!: number;

  @IsNumber()
  @Type(() => Number)
  readonly concertId!: number;
}
