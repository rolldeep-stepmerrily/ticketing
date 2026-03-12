import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/common/prisma';

export class GetMyBookingsQuery extends Query<GetMyBookingsResult> {
  constructor(public readonly props: GetMyBookingsQueryProps) {
    super();
  }
}

@QueryHandler(GetMyBookingsQuery)
export class GetMyBookingsQueryHandler implements IQueryHandler<GetMyBookingsQuery, GetMyBookingsResult> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 내 예매 내역 조회
   *
   * @param {GetMyBookingsQuery} query 조회 쿼리
   * @returns {Promise<GetMyBookingsResult>} 티켓 목록
   */
  async execute(query: GetMyBookingsQuery): Promise<GetMyBookingsResult> {
    return await this.prisma.ticket.findMany({
      where: { userId: query.props.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        seat: {
          select: {
            id: true,
            row: true,
            number: true,
            grade: true,
            price: true,
            concert: {
              select: { id: true, title: true, venue: true, startsAt: true },
            },
          },
        },
      },
    });
  }
}

interface GetMyBookingsQueryProps {
  userId: number;
}

type GetMyBookingsResult = Array<{
  id: number;
  status: string;
  createdAt: Date;
  seat: {
    id: number;
    row: string;
    number: number;
    grade: string;
    price: number;
    concert: { id: number; title: string; venue: string; startsAt: Date };
  };
}>;
