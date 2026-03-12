import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetConcertUseCase } from '../../application/use-cases/get-concert.use-case';
import { GetConcertSeatsUseCase } from '../../application/use-cases/get-concert-seats.use-case';
import { GetConcertsUseCase } from '../../application/use-cases/get-concerts.use-case';
import { ConcertRouter } from './concert.path.presenter';
import { GetConcertResponseDataDto } from './dto/get-concert.dto';
import { GetConcertSeatsResponseDataDto } from './dto/get-concert-seats.dto';
import { GetConcertsRequestQueryDto, GetConcertsResponseDataDto } from './dto/get-concerts.dto';

@ApiTags(ConcertRouter.HttpApiTags)
@Controller(ConcertRouter.Root)
export class ConcertHttpController {
  constructor(
    private readonly getConcertsUseCase: GetConcertsUseCase,
    private readonly getConcertUseCase: GetConcertUseCase,
    private readonly getConcertSeatsUseCase: GetConcertSeatsUseCase,
  ) {}

  /**
   * 공연 목록 조회 엔드포인트
   *
   * @param {GetConcertsRequestQueryDto} queryDto 조회 파라미터
   * @returns {Promise<GetConcertsResponseDataDto>} 공연 목록 응답
   */
  @ApiOperation({ summary: '공연 목록 조회' })
  @Get(ConcertRouter.Http.GetList)
  async getConcerts(@Query() queryDto: GetConcertsRequestQueryDto): Promise<GetConcertsResponseDataDto> {
    return await this.getConcertsUseCase.execute({ queryDto });
  }

  /**
   * 공연 상세 조회 엔드포인트
   *
   * @param {number} id 공연 ID
   * @returns {Promise<GetConcertResponseDataDto>} 공연 상세 응답
   */
  @ApiOperation({ summary: '공연 상세 조회' })
  @Get(ConcertRouter.Http.GetOne)
  async getConcert(@Param('id', ParseIntPipe) id: number): Promise<GetConcertResponseDataDto> {
    return await this.getConcertUseCase.execute({ concertId: id });
  }

  /**
   * 공연 좌석 목록 조회 엔드포인트
   *
   * @param {number} id 공연 ID
   * @returns {Promise<GetConcertSeatsResponseDataDto>} 좌석 목록 응답
   */
  @ApiOperation({ summary: '공연 좌석 목록 조회' })
  @Get(ConcertRouter.Http.GetSeats)
  async getConcertSeats(@Param('id', ParseIntPipe) id: number): Promise<GetConcertSeatsResponseDataDto> {
    return await this.getConcertSeatsUseCase.execute({ concertId: id });
  }
}
