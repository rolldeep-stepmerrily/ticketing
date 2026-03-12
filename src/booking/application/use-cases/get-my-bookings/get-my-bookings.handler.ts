import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma';
import { GetMyBookingsQuery, GetMyBookingsResult } from './get-my-bookings.query';

@QueryHandler(GetMyBookingsQuery)
export class GetMyBookingsHandler implements IQueryHandler<GetMyBookingsQuery, GetMyBookingsResult> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: GetMyBookingsQuery): Promise<GetMyBookingsResult> {
    const data = await this.prismaService.ticket.findMany({
      where: { userId: query.userId },
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

    return { data };
  }
}
