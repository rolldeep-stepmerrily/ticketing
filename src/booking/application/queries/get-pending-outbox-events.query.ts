import { PrismaService } from '@@db';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

const OUTBOX_BATCH_SIZE = 100;

export class GetPendingOutboxEventsQuery extends Query<OutboxEventRecord[]> {
  constructor() {
    super();
  }
}

@QueryHandler(GetPendingOutboxEventsQuery)
export class GetPendingOutboxEventsQueryHandler
  implements IQueryHandler<GetPendingOutboxEventsQuery, OutboxEventRecord[]>
{
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 미발행 Outbox 이벤트 조회 (최대 100건)
   *
   * @param {GetPendingOutboxEventsQuery} _query 조회 쿼리
   * @returns {Promise<OutboxEventRecord[]>} 미발행 이벤트 목록
   */
  async execute(_query: GetPendingOutboxEventsQuery): Promise<OutboxEventRecord[]> {
    return await this.prisma.outboxEvent.findMany({
      where: { publishedAt: null },
      orderBy: { createdAt: 'asc' },
      take: OUTBOX_BATCH_SIZE,
    });
  }
}

interface OutboxEventRecord {
  id: number;
  aggregateId: string;
  eventType: string;
  payload: unknown;
  publishedAt: Date | null;
  createdAt: Date;
}
