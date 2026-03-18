import { SeatGrade } from '@@prisma';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateConcertSeatDto {
  @ApiProperty({ example: 'A', description: '좌석 행' })
  @IsString()
  readonly row!: string;

  @ApiProperty({ example: 1, description: '좌석 번호' })
  @IsInt()
  @Min(1)
  readonly number!: number;

  @ApiProperty({ enum: SeatGrade, example: SeatGrade.VIP, description: '좌석 등급' })
  @IsEnum(SeatGrade)
  readonly grade!: SeatGrade;

  @ApiProperty({ example: 150000, description: '가격 (원)' })
  @IsInt()
  @Min(0)
  readonly price!: number;
}

export class CreateConcertRequestBodyDto {
  @ApiProperty({ example: '2024 봄 콘서트', description: '공연 제목' })
  @IsString()
  readonly title!: string;

  @ApiProperty({ example: '올림픽공원 체조경기장', description: '공연 장소' })
  @IsString()
  readonly venue!: string;

  @ApiProperty({ example: '2024-06-01T18:00:00.000Z', description: '공연 시작 일시' })
  @IsDateString()
  readonly startsAt!: string;

  @ApiProperty({ example: '2024-06-01T21:00:00.000Z', description: '공연 종료 일시' })
  @IsDateString()
  readonly endsAt!: string;

  @ApiProperty({ example: '봄을 맞이하는 특별 공연', required: false })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiProperty({ type: [CreateConcertSeatDto], description: '좌석 목록 (최소 1개)' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateConcertSeatDto)
  readonly seats!: CreateConcertSeatDto[];
}

export class CreateConcertResponseDataDto {
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

  @ApiProperty({ type: Number, description: '좌석 수' })
  readonly seatCount!: number;

  /**
   * 공연 생성 결과로부터 응답 DTO 생성
   *
   * @param {CreateConcertResponseDataDto} data 공연 데이터
   * @returns {CreateConcertResponseDataDto} 응답 DTO
   */
  static from(data: CreateConcertResponseDataDto): CreateConcertResponseDataDto {
    return {
      id: data.id,
      title: data.title,
      venue: data.venue,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      seatCount: data.seatCount,
    };
  }
}
