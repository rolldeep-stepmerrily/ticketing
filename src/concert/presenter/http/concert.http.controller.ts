import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '@@guards';
import { CreateConcertUseCase } from '../../application/use-cases/create-concert.use-case';
import { GetConcertUseCase } from '../../application/use-cases/get-concert.use-case';
import { GetConcertSeatsUseCase } from '../../application/use-cases/get-concert-seats.use-case';
import { GetConcertsUseCase } from '../../application/use-cases/get-concerts.use-case';
import { ConcertRouter } from './concert.path.presenter';
import { CreateConcertRequestBodyDto, CreateConcertResponseDataDto } from './dto/create-concert.dto';
import { GetConcertResponseDataDto } from './dto/get-concert.dto';
import { GetConcertSeatsResponseDataDto } from './dto/get-concert-seats.dto';
import { GetConcertsRequestQueryDto, GetConcertsResponseDataDto } from './dto/get-concerts.dto';

@ApiTags(ConcertRouter.HttpApiTags)
@Controller(ConcertRouter.Root)
export class ConcertHttpController {
  constructor(
    private readonly createConcertUseCase: CreateConcertUseCase,
    private readonly getConcertsUseCase: GetConcertsUseCase,
    private readonly getConcertUseCase: GetConcertUseCase,
    private readonly getConcertSeatsUseCase: GetConcertSeatsUseCase,
  ) {}

  /**
   * 공연 등록 엔드포인트 (어드민)
   *
   * @param {CreateConcertRequestBodyDto} bodyDto 공연 등록 데이터
   * @returns {Promise<CreateConcertResponseDataDto>} 등록된 공연 정보
   */
  @ApiOperation({ summary: '공연 등록 (어드민) — 좌석 생성 및 Redis 재고 초기화 포함' })
  @ApiBearerAuth('accessToken')
  @ApiBody({ type: CreateConcertRequestBodyDto })
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post(ConcertRouter.Http.Create)
  async createConcert(@Body() bodyDto: CreateConcertRequestBodyDto): Promise<CreateConcertResponseDataDto> {
    return await this.createConcertUseCase.execute({ bodyDto });
  }

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
