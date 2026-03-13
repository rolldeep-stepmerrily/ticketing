import { TypedQueryBus } from '@@cqrs';
import { Injectable } from '@nestjs/common';
import { GetConcertsRequestQueryDto, GetConcertsResponseDataDto } from '../../presenter/http/dto/get-concerts.dto';
import { GetConcertsQuery } from '../queries/get-concerts.query';

@Injectable()
export class GetConcertsUseCase {
  constructor(private readonly queryBus: TypedQueryBus<GetConcertsQuery>) {}

  /**
   * 공연 목록 조회 실행
   *
   * @param {GetConcertsUseCaseProps} props 조회 파라미터
   * @returns {Promise<GetConcertsResponseDataDto>} 공연 목록 응답
   */
  async execute(props: GetConcertsUseCaseProps): Promise<GetConcertsResponseDataDto> {
    const { page, limit, search } = props.queryDto;

    const result = await this.fetchConcerts({ page, limit, search });

    return this.buildResponseDto(result);
  }

  /**
   * 공연 목록 데이터 조회
   *
   * @param {{ page: number; limit: number; search?: string }} params 페이지네이션 파라미터
   * @returns {Promise<ConcertListResult>} 조회 결과
   */
  private async fetchConcerts(params: { page: number; limit: number; search?: string }): Promise<ConcertListResult> {
    return await this.queryBus.execute(new GetConcertsQuery(params));
  }

  /**
   * 응답 DTO 생성
   *
   * @param {ConcertListResult} result 조회 결과
   * @returns {GetConcertsResponseDataDto} 응답 DTO
   */
  private buildResponseDto(result: ConcertListResult): GetConcertsResponseDataDto {
    return GetConcertsResponseDataDto.from(result);
  }
}

interface GetConcertsUseCaseProps {
  queryDto: GetConcertsRequestQueryDto;
}

interface ConcertListResult {
  data: Array<{ id: number; title: string; venue: string; startsAt: Date; endsAt: Date; createdAt: Date }>;
  total: number;
}
