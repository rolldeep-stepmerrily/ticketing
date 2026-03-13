import { TypedQueryBus } from '@@cqrs';
import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { CONCERT_ERRORS } from '../../concert.error';
import { GetConcertSeatsResponseDataDto } from '../../presenter/http/dto/get-concert-seats.dto';
import { GetConcertQuery } from '../queries/get-concert.query';
import { GetConcertSeatsQuery } from '../queries/get-concert-seats.query';

@Injectable()
export class GetConcertSeatsUseCase {
  constructor(private readonly queryBus: TypedQueryBus<GetConcertQuery | GetConcertSeatsQuery>) {}

  /**
   * 공연 좌석 목록 조회 실행
   *
   * @param {GetConcertSeatsUseCaseProps} props 조회 파라미터
   * @returns {Promise<GetConcertSeatsResponseDataDto>} 좌석 목록 응답
   * @throws {AppException} 공연을 찾을 수 없는 경우
   */
  async execute(props: GetConcertSeatsUseCaseProps): Promise<GetConcertSeatsResponseDataDto> {
    await this.validateConcertExists(props.concertId);

    const seats = await this.fetchSeats(props.concertId);

    return this.buildResponseDto(seats);
  }

  /**
   * 공연 존재 여부 확인
   *
   * @param {number} concertId 공연 ID
   * @throws {AppException} 공연이 존재하지 않는 경우
   */
  private async validateConcertExists(concertId: number): Promise<void> {
    const concert = await this.queryBus.execute(new GetConcertQuery({ concertId }));

    if (!isDefined(concert)) {
      throw new AppException(CONCERT_ERRORS.NOT_FOUND);
    }
  }

  /**
   * 좌석 목록 조회
   *
   * @param {number} concertId 공연 ID
   * @returns {Promise<SeatData[]>} 좌석 목록
   */
  private async fetchSeats(concertId: number): Promise<SeatData[]> {
    return await this.queryBus.execute(new GetConcertSeatsQuery({ concertId }));
  }

  /**
   * 응답 DTO 생성
   *
   * @param {SeatData[]} seats 좌석 데이터
   * @returns {GetConcertSeatsResponseDataDto} 응답 DTO
   */
  private buildResponseDto(seats: SeatData[]): GetConcertSeatsResponseDataDto {
    return GetConcertSeatsResponseDataDto.from(seats);
  }
}

interface GetConcertSeatsUseCaseProps {
  concertId: number;
}

interface SeatData {
  id: number;
  row: string;
  number: number;
  grade: string;
  price: number;
  status: string;
}
