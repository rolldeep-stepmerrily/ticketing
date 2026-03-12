import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { TypedQueryBus } from 'src/common/cqrs';
import { CONCERT_ERRORS } from '../../concert.error';
import { GetConcertResponseDataDto } from '../../presenter/http/dto/get-concert.dto';
import { GetConcertQuery } from '../queries/get-concert.query';

@Injectable()
export class GetConcertUseCase {
  constructor(private readonly queryBus: TypedQueryBus<GetConcertQuery>) {}

  /**
   * 공연 단건 조회 실행
   *
   * @param {GetConcertUseCaseProps} props 조회 파라미터
   * @returns {Promise<GetConcertResponseDataDto>} 공연 상세 응답
   * @throws {AppException} 공연을 찾을 수 없는 경우
   */
  async execute(props: GetConcertUseCaseProps): Promise<GetConcertResponseDataDto> {
    const concert = await this.findConcert(props.concertId);

    return this.buildResponseDto(concert);
  }

  /**
   * 공연 조회 및 존재 검증
   *
   * @param {number} concertId 공연 ID
   * @returns {Promise<ConcertData>} 공연 정보
   * @throws {AppException} 공연이 존재하지 않는 경우
   */
  private async findConcert(concertId: number): Promise<ConcertData> {
    const concert = await this.queryBus.execute(new GetConcertQuery({ concertId }));

    if (!isDefined(concert)) {
      throw new AppException(CONCERT_ERRORS.NOT_FOUND);
    }

    return concert;
  }

  /**
   * 응답 DTO 생성
   *
   * @param {ConcertData} concert 공연 데이터
   * @returns {GetConcertResponseDataDto} 응답 DTO
   */
  private buildResponseDto(concert: ConcertData): GetConcertResponseDataDto {
    return GetConcertResponseDataDto.from(concert);
  }
}

interface GetConcertUseCaseProps {
  concertId: number;
}

interface ConcertData {
  id: number;
  title: string;
  description: string | null;
  venue: string;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
}
