import { TypedCommandBus, TypedQueryBus } from '@@cqrs';
import { KafkaProducerService } from '@@kafka';
import { RedisService } from '@@redis';
import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MarkOutboxEventPublishedCommand } from '../application/commands/mark-outbox-event-published.command';
import { GetPendingOutboxEventsQuery } from '../application/queries/get-pending-outbox-events.query';

const OUTBOX_LOCK_KEY = 'ticketing:outbox:publisher:lock';
const OUTBOX_LOCK_TTL_SECONDS = 30;

@Injectable()
export class OutboxPublisherService {
  private readonly logger = new Logger(OutboxPublisherService.name);

  constructor(
    private readonly queryBus: TypedQueryBus<GetPendingOutboxEventsQuery>,
    private readonly commandBus: TypedCommandBus<MarkOutboxEventPublishedCommand>,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 5초마다 미발행 Outbox 이벤트를 Kafka로 발행
   *
   * DB 트랜잭션과 Kafka 발행의 원자성을 보장하는 Transactional Outbox 패턴.
   * 각 이벤트는 발행 성공 시 publishedAt을 기록하여 중복 발행을 방지합니다.
   * 분산 락(Redis SET NX EX)으로 다중 인스턴스 및 Cron 중복 실행을 방지합니다.
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async publishPendingEvents(): Promise<void> {
    const lockValue = randomUUID();
    const acquired = await this.redisService.acquireLock(OUTBOX_LOCK_KEY, lockValue, OUTBOX_LOCK_TTL_SECONDS);

    if (!acquired) {
      return;
    }

    try {
      await this.processEvents();
    } finally {
      await this.redisService.releaseLock(OUTBOX_LOCK_KEY, lockValue);
    }
  }

  /**
   * 미발행 Outbox 이벤트 배치 처리
   */
  private async processEvents(): Promise<void> {
    const events = await this.queryBus.execute(new GetPendingOutboxEventsQuery());

    if (events.length === 0) {
      return;
    }

    for (const event of events) {
      try {
        await this.kafkaProducerService.sendMessage(event.eventType, event.payload, event.aggregateId);

        await this.commandBus.execute(new MarkOutboxEventPublishedCommand({ eventId: event.id }));
      } catch (error) {
        this.logger.error(`Failed to publish outbox event id=${event.id}: ${error}`);
      }
    }
  }
}
