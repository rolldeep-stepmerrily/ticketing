import { AppException } from '@@exceptions';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma';
import { CONCERT_ERRORS } from '../../../concert.error';
import { GetConcertQuery, GetConcertResult } from './get-concert.query';

@QueryHandler(GetConcertQuery)
export class GetConcertHandler implements IQueryHandler<GetConcertQuery, GetConcertResult> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: GetConcertQuery): Promise<GetConcertResult> {
    const concert = await this.prismaService.concert.findFirst({
      where: { id: query.concertId, deletedAt: null },
      select: { id: true, title: true, description: true, venue: true, startsAt: true, endsAt: true, createdAt: true },
    });

    if (!concert) throw new AppException(CONCERT_ERRORS.NOT_FOUND);

    return concert;
  }
}
