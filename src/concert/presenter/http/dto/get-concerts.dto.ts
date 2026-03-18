import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GetConcertsRequestQueryDto {
  @ApiProperty({ example: 1, default: 1, description: '페이지 번호', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number = 1;

  @ApiProperty({ example: 20, default: 20, description: '페이지당 항목 수', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly limit: number = 20;

  @ApiProperty({ example: '콘서트', description: '검색어', required: false })
  @IsOptional()
  @IsString()
  readonly search?: string;
}

export class ConcertItemDto {
  @ApiProperty({ type: Number, description: '공연 ID' })
  readonly id!: number;

  @ApiProperty({ type: String, description: '공연 제목' })
  readonly title!: string;

  @ApiProperty({ type: String, description: '공연 장소' })
  readonly venue!: string;

  @ApiProperty({ type: Date, description: '공연 시작 일시' })
  readonly startsAt!: Date;

  @ApiProperty({ type: Date, description: '공연 종료 일시' })
  readonly endsAt!: Date;

  @ApiProperty({ type: Date, description: '생성 일시' })
  readonly createdAt!: Date;
}

export class GetConcertsResponseDataDto {
  @ApiProperty({ type: [ConcertItemDto], description: '공연 목록' })
  readonly data!: ConcertItemDto[];

  @ApiProperty({ type: Number, description: '전체 공연 수' })
  readonly total!: number;

  /**
   * 조회 결과로부터 응답 DTO 생성
   *
   * @param {{ data: ConcertItemDto[]; total: number }} result 조회 결과
   * @returns {GetConcertsResponseDataDto} 응답 DTO
   */
  static from(result: { data: ConcertItemDto[]; total: number }): GetConcertsResponseDataDto {
    return { data: result.data, total: result.total };
  }
}
