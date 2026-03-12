import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from '@@db';

export class GetTicketQuery extends Query<GetTicketResult | null> {
  constructor(public readonly props: GetTicketQueryProps) {
    super();
  }
}

@QueryHandler(GetTicketQuery)
export class GetTicketQueryHandler implements IQueryHandler<GetTicketQuery, GetTicketResult | null> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 티켓 단건 조회 (소유자 및 좌석 정보 포함)
   *
   * @param {GetTicketQuery} query 조회 쿼리
   * @returns {Promise<GetTicketResult | null>} 티켓 정보 또는 null
   */
  async execute(query: GetTicketQuery): Promise<GetTicketResult | null> {
    return await this.prisma.ticket.findFirst({
      where: { id: query.props.ticketId, userId: query.props.userId },
      include: { seat: true },
    });
  }
}

interface GetTicketQueryProps {
  ticketId: number;
  userId: number;
}

interface GetTicketResult {
  id: number;
  userId: number;
  seatId: number;
  status: string;
  seat: { concertId: number };
}
