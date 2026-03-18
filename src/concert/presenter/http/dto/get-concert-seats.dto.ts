import { ApiProperty } from '@nestjs/swagger';

export class SeatItemDto {
  @ApiProperty({ type: Number, description: '좌석 ID' })
  readonly id!: number;

  @ApiProperty({ type: String, description: '좌석 행' })
  readonly row!: string;

  @ApiProperty({ type: Number, description: '좌석 번호' })
  readonly number!: number;

  @ApiProperty({ type: String, description: '좌석 등급' })
  readonly grade!: string;

  @ApiProperty({ type: Number, description: '가격' })
  readonly price!: number;

  @ApiProperty({ type: String, description: '좌석 상태' })
  readonly status!: string;
}

export class GetConcertSeatsResponseDataDto {
  @ApiProperty({ type: [SeatItemDto], description: '좌석 목록' })
  readonly data!: SeatItemDto[];

  /**
   * 좌석 목록으로부터 응답 DTO 생성
   *
   * @param {SeatItemDto[]} data 좌석 목록
   * @returns {GetConcertSeatsResponseDataDto} 응답 DTO
   */
  static from(data: SeatItemDto[]): GetConcertSeatsResponseDataDto {
    return { data };
  }
}
