import { ApiProperty } from '@nestjs/swagger';

export class SeatItemDto {
  @ApiProperty()
  readonly id!: number;

  @ApiProperty()
  readonly row!: string;

  @ApiProperty()
  readonly number!: number;

  @ApiProperty()
  readonly grade!: string;

  @ApiProperty()
  readonly price!: number;

  @ApiProperty()
  readonly status!: string;
}

export class GetConcertSeatsResponseDataDto {
  @ApiProperty({ type: [SeatItemDto] })
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
