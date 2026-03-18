import { ApiProperty } from '@nestjs/swagger';

export class GetConcertResponseDataDto {
  @ApiProperty({ type: Number, description: '공연 ID' })
  readonly id!: number;

  @ApiProperty({ type: String, description: '공연 제목' })
  readonly title!: string;

  @ApiProperty({ type: String, description: '공연 설명', nullable: true })
  readonly description!: string | null;

  @ApiProperty({ type: String, description: '공연 장소' })
  readonly venue!: string;

  @ApiProperty({ type: Date, description: '공연 시작 일시' })
  readonly startsAt!: Date;

  @ApiProperty({ type: Date, description: '공연 종료 일시' })
  readonly endsAt!: Date;

  @ApiProperty({ type: Date, description: '생성 일시' })
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
