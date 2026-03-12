import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { TypedQueryBus } from 'src/common/cqrs';
import { GetConcertQuery, GetConcertResult } from '../../application/use-cases/get-concert/get-concert.query';
import {
  GetConcertSeatsQuery,
  GetConcertSeatsResult,
} from '../../application/use-cases/get-concert-seats/get-concert-seats.query';
import { GetConcertsQuery, GetConcertsResult } from '../../application/use-cases/get-concerts/get-concerts.query';
import { GetConcertsDto } from './dto/get-concerts.dto';

type ConcertQuery = GetConcertsQuery | GetConcertQuery | GetConcertSeatsQuery;

@ApiTags('concerts')
@Controller('concerts')
export class ConcertHttpController {
  constructor(private readonly queryBus: TypedQueryBus<ConcertQuery>) {}

  @ApiOperation({ summary: '공연 목록 조회' })
  @Get()
  async getConcerts(@Query() dto: GetConcertsDto): Promise<GetConcertsResult> {
    return await this.queryBus.execute(new GetConcertsQuery(dto.page, dto.limit, dto.search));
  }

  @ApiOperation({ summary: '공연 상세 조회' })
  @Get(':id')
  async getConcert(@Param('id', ParseIntPipe) id: number): Promise<GetConcertResult> {
    return await this.queryBus.execute(new GetConcertQuery(id));
  }

  @ApiOperation({ summary: '공연 좌석 목록 조회' })
  @Get(':id/seats')
  async getConcertSeats(@Param('id', ParseIntPipe) id: number): Promise<GetConcertSeatsResult> {
    return await this.queryBus.execute(new GetConcertSeatsQuery(id));
  }
}
