import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/common/prisma';

export class GetConcertSeatsQuery extends Query<GetConcertSeatsResult> {
  constructor(public readonly props: GetConcertSeatsQueryProps) {
    super();
  }
}

@QueryHandler(GetConcertSeatsQuery)
export class GetConcertSeatsQueryHandler implements IQueryHandler<GetConcertSeatsQuery, GetConcertSeatsResult> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 공연 좌석 목록 조회
   *
   * @param {GetConcertSeatsQuery} query 조회 쿼리
   * @returns {Promise<GetConcertSeatsResult>} 좌석 목록
   */
  async execute(query: GetConcertSeatsQuery): Promise<GetConcertSeatsResult> {
    return await this.prisma.seat.findMany({
      where: { concertId: query.props.concertId },
      orderBy: [{ row: 'asc' }, { number: 'asc' }],
      select: { id: true, row: true, number: true, grade: true, price: true, status: true },
    });
  }
}

interface GetConcertSeatsQueryProps {
  concertId: number;
}

type GetConcertSeatsResult = Array<{
  id: number;
  row: string;
  number: number;
  grade: string;
  price: number;
  status: string;
}>;
