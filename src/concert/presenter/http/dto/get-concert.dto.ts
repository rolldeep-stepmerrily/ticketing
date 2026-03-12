import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetConcertResponseDataDto {
  @ApiProperty()
  readonly id!: number;

  @ApiProperty()
  readonly title!: string;

  @ApiPropertyOptional()
  readonly description!: string | null;

  @ApiProperty()
  readonly venue!: string;

  @ApiProperty()
  readonly startsAt!: Date;

  @ApiProperty()
  readonly endsAt!: Date;

  @ApiProperty()
  readonly createdAt!: Date;

  /**
   * 엔티티로부터 응답 DTO 생성
   *
   * @param {GetConcertResponseDataDto} data 공연 데이터
   * @returns {GetConcertResponseDataDto} 응답 DTO
   */
  static from(data: GetConcertResponseDataDto): GetConcertResponseDataDto {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      venue: data.venue,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      createdAt: data.createdAt,
    };
  }
}
