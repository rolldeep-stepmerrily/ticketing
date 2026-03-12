import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma';
import { GetConcertsQuery, GetConcertsResult } from './get-concerts.query';

@QueryHandler(GetConcertsQuery)
export class GetConcertsHandler implements IQueryHandler<GetConcertsQuery, GetConcertsResult> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: GetConcertsQuery): Promise<GetConcertsResult> {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(search && { title: { contains: search, mode: 'insensitive' as const } }),
    };

    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.concert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startsAt: 'asc' },
        select: { id: true, title: true, venue: true, startsAt: true, endsAt: true, createdAt: true },
      }),
      this.prismaService.concert.count({ where }),
    ]);

    return { data, total };
  }
}
