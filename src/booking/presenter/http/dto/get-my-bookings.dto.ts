import { ApiProperty } from '@nestjs/swagger';

class BookingConcertDto {
  @ApiProperty({ type: Number, description: '공연 ID' })
  readonly id!: number;

  @ApiProperty({ type: String, description: '공연 제목' })
  readonly title!: string;

  @ApiProperty({ type: String, description: '공연 장소' })
  readonly venue!: string;

  @ApiProperty({ type: Date, description: '공연 시작 일시' })
  readonly startsAt!: Date;
}

class BookingSeatDto {
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

  @ApiProperty({ type: () => BookingConcertDto, description: '공연 정보' })
  readonly concert!: BookingConcertDto;
}

export class BookingItemDto {
  @ApiProperty({ type: Number, description: '예매 ID' })
  readonly id!: number;

  @ApiProperty({ type: String, description: '예매 상태' })
  readonly status!: string;

  @ApiProperty({ type: Date, description: '예매 생성 일시' })
  readonly createdAt!: Date;

  @ApiProperty({ type: () => BookingSeatDto, description: '좌석 정보' })
  readonly seat!: BookingSeatDto;
}

export class GetMyBookingsResponseDataDto {
  @ApiProperty({ type: [BookingItemDto], description: '예매 목록' })
  readonly data!: BookingItemDto[];

  /**
   * 티켓 목록으로부터 응답 DTO 생성
   *
   * @param {BookingItemDto[]} data 티켓 목록
   * @returns {GetMyBookingsResponseDataDto} 응답 DTO
   */
  static from(data: BookingItemDto[]): GetMyBookingsResponseDataDto {
    return { data };
  }
}
