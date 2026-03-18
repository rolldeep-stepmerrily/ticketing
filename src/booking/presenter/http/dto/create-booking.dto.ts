import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateBookingRequestBodyDto {
  @ApiProperty({ example: 1, description: '예매할 좌석 ID', type: Number })
  @IsInt()
  @Min(1)
  readonly seatId!: number;
}

export class CreateBookingResponseDataDto {
  @ApiProperty({ type: Number, description: '예매 ID' })
  readonly id!: number;

  @ApiProperty({ type: Number, description: '좌석 ID' })
  readonly seatId!: number;

  @ApiProperty({ type: String, description: '예매 상태' })
  readonly status!: string;

  @ApiProperty({ type: Date, description: '예매 생성 일시' })
  readonly createdAt!: Date;

  /**
   * 티켓 데이터로부터 응답 DTO 생성
   *
   * @param {CreateBookingResponseDataDto} data 티켓 데이터
   * @returns {CreateBookingResponseDataDto} 응답 DTO
   */
  static from(data: CreateBookingResponseDataDto): CreateBookingResponseDataDto {
    return { id: data.id, seatId: data.seatId, status: data.status, createdAt: data.createdAt };
  }
}
