import { PrismaService } from '@@db';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

export class GetConcertQuery extends Query<GetConcertResult | null> {
  constructor(public readonly props: GetConcertQueryProps) {
    super();
  }
}

@QueryHandler(GetConcertQuery)
export class GetConcertQueryHandler implements IQueryHandler<GetConcertQuery, GetConcertResult | null> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 공연 단건 조회
   *
   * @param {GetConcertQuery} query 조회 쿼리
   * @returns {Promise<GetConcertResult | null>} 공연 정보 또는 null
   */
  async execute(query: GetConcertQuery): Promise<GetConcertResult | null> {
    return await this.prisma.concert.findFirst({
      where: { id: query.props.concertId, deletedAt: null },
      select: { id: true, title: true, description: true, venue: true, startsAt: true, endsAt: true, createdAt: true },
    });
  }
}

interface GetConcertQueryProps {
  concertId: number;
}

interface GetConcertResult {
  id: number;
  title: string;
  description: string | null;
  venue: string;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
}
