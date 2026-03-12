import { AppException } from '@@exceptions';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma';
import { CONCERT_ERRORS } from '../../../concert.error';
import { GetConcertSeatsQuery, GetConcertSeatsResult } from './get-concert-seats.query';

@QueryHandler(GetConcertSeatsQuery)
export class GetConcertSeatsHandler implements IQueryHandler<GetConcertSeatsQuery, GetConcertSeatsResult> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: GetConcertSeatsQuery): Promise<GetConcertSeatsResult> {
    const concert = await this.prismaService.concert.findFirst({
      where: { id: query.concertId, deletedAt: null },
      select: { id: true },
    });

    if (!concert) throw new AppException(CONCERT_ERRORS.NOT_FOUND);

    const data = await this.prismaService.seat.findMany({
      where: { concertId: query.concertId },
      orderBy: [{ row: 'asc' }, { number: 'asc' }],
      select: { id: true, row: true, number: true, grade: true, price: true, status: true },
    });

    return { data };
  }
}
