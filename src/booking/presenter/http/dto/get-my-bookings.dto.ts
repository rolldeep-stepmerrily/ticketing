import { ApiProperty } from '@nestjs/swagger';

class BookingConcertDto {
  @ApiProperty()
  readonly id!: number;

  @ApiProperty()
  readonly title!: string;

  @ApiProperty()
  readonly venue!: string;

  @ApiProperty()
  readonly startsAt!: Date;
}

class BookingSeatDto {
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

  @ApiProperty({ type: () => BookingConcertDto })
  readonly concert!: BookingConcertDto;
}

export class BookingItemDto {
  @ApiProperty()
  readonly id!: number;

  @ApiProperty()
  readonly status!: string;

  @ApiProperty()
  readonly createdAt!: Date;

  @ApiProperty({ type: () => BookingSeatDto })
  readonly seat!: BookingSeatDto;
}

export class GetMyBookingsResponseDataDto {
  @ApiProperty({ type: [BookingItemDto] })
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
