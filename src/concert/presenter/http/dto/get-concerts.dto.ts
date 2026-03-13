import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GetConcertsRequestQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly limit: number = 20;

  @ApiPropertyOptional({ example: '콘서트' })
  @IsOptional()
  @IsString()
  readonly search?: string;
}

export class ConcertItemDto {
  @ApiProperty()
  readonly id!: number;

  @ApiProperty()
  readonly title!: string;

  @ApiProperty()
  readonly venue!: string;

  @ApiProperty()
  readonly startsAt!: Date;

  @ApiProperty()
  readonly endsAt!: Date;

  @ApiProperty()
  readonly createdAt!: Date;
}

export class GetConcertsResponseDataDto {
  @ApiProperty({ type: [ConcertItemDto] })
  readonly data!: ConcertItemDto[];

  @ApiProperty()
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
