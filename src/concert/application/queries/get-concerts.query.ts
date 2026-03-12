import { PrismaService } from '@@db';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { isDefined } from 'class-validator';

export class GetConcertsQuery extends Query<GetConcertsResult> {
  constructor(public readonly props: GetConcertsQueryProps) {
    super();
  }
}

@QueryHandler(GetConcertsQuery)
export class GetConcertsQueryHandler implements IQueryHandler<GetConcertsQuery, GetConcertsResult> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 공연 목록 조회
   *
   * @param {GetConcertsQuery} query 조회 쿼리
   * @returns {Promise<GetConcertsResult>} 공연 목록 및 총 개수
   */
  async execute(query: GetConcertsQuery): Promise<GetConcertsResult> {
    const { page, limit, search } = query.props;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(isDefined(search) && { title: { contains: search, mode: 'insensitive' as const } }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.concert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startsAt: 'asc' },
        select: { id: true, title: true, venue: true, startsAt: true, endsAt: true, createdAt: true },
      }),
      this.prisma.concert.count({ where }),
    ]);

    return { data, total };
  }
}

interface GetConcertsQueryProps {
  page: number;
  limit: number;
  search?: string;
}

interface GetConcertsResult {
  data: Array<{ id: number; title: string; venue: string; startsAt: Date; endsAt: Date; createdAt: Date }>;
  total: number;
}
