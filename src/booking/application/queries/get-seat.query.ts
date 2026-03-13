import { PrismaService } from '@@db';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

export class GetSeatQuery extends Query<GetSeatResult | null> {
  constructor(public readonly props: GetSeatQueryProps) {
    super();
  }
}

@QueryHandler(GetSeatQuery)
export class GetSeatQueryHandler implements IQueryHandler<GetSeatQuery, GetSeatResult | null> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 좌석 단건 조회
   *
   * @param {GetSeatQuery} query 조회 쿼리
   * @returns {Promise<GetSeatResult | null>} 좌석 정보 또는 null
   */
  async execute(query: GetSeatQuery): Promise<GetSeatResult | null> {
    return await this.prisma.seat.findUnique({
      where: { id: query.props.seatId },
      select: {
        id: true,
        concertId: true,
        row: true,
        number: true,
        grade: true,
        price: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

interface GetSeatQueryProps {
  seatId: number;
}

interface GetSeatResult {
  id: number;
  concertId: number;
  row: string;
  number: number;
  grade: string;
  price: number;
  status: string;
  createdAt: Date;
  updatedAt: Date | null;
}
