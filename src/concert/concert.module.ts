import { Module } from '@nestjs/common';

import { GetConcertHandler } from './application/use-cases/get-concert/get-concert.handler';
import { GetConcertSeatsHandler } from './application/use-cases/get-concert-seats/get-concert-seats.handler';
import { GetConcertsHandler } from './application/use-cases/get-concerts/get-concerts.handler';
import { ConcertHttpController } from './presenter/http/concert.http-controller';

@Module({
  controllers: [ConcertHttpController],
  providers: [GetConcertsHandler, GetConcertHandler, GetConcertSeatsHandler],
})
export class ConcertModule {}
