import { JwtGuard } from '@@guards';
import { Module } from '@nestjs/common';
import { CreateConcertCommandHandler } from './application/commands/create-concert.command';
import { GetConcertQueryHandler } from './application/queries/get-concert.query';
import { GetConcertSeatsQueryHandler } from './application/queries/get-concert-seats.query';
import { GetConcertsQueryHandler } from './application/queries/get-concerts.query';
import { CreateConcertUseCase } from './application/use-cases/create-concert.use-case';
import { GetConcertUseCase } from './application/use-cases/get-concert.use-case';
import { GetConcertSeatsUseCase } from './application/use-cases/get-concert-seats.use-case';
import { GetConcertsUseCase } from './application/use-cases/get-concerts.use-case';
import { ConcertHttpController } from './presenter/http/concert.http.controller';

@Module({
  controllers: [ConcertHttpController],
  providers: [
    /** query-handlers */
    GetConcertsQueryHandler,
    GetConcertQueryHandler,
    GetConcertSeatsQueryHandler,

    /** command-handlers */
    CreateConcertCommandHandler,

    /** use-cases */
    CreateConcertUseCase,
    GetConcertsUseCase,
    GetConcertUseCase,
    GetConcertSeatsUseCase,

    /** infrastructure */
    JwtGuard,
  ],
})
export class ConcertModule {}
