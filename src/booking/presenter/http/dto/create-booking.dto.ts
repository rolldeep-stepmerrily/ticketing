import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 1, description: '예매할 좌석 ID' })
  @IsInt()
  @Min(1)
  readonly seatId!: number;
}
