import { PrismaService } from '@@db';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

export class CheckInboxEventExistsQuery extends Query<boolean> {
  constructor(public readonly props: CheckInboxEventExistsQueryProps) {
    super();
  }
}

@QueryHandler(CheckInboxEventExistsQuery)
export class CheckInboxEventExistsQueryHandler implements IQueryHandler<CheckInboxEventExistsQuery, boolean> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inbox 이벤트 중복 여부 확인
   *
   * @param {CheckInboxEventExistsQuery} query 조회 쿼리
   * @returns {Promise<boolean>} 이미 처리된 이벤트면 true
   */
  async execute(query: CheckInboxEventExistsQuery): Promise<boolean> {
    const { eventId } = query.props;

    const count = await this.prisma.inboxEvent.count({
      where: { id: eventId },
    });

    return count > 0;
  }
}

interface CheckInboxEventExistsQueryProps {
  eventId: string;
}
