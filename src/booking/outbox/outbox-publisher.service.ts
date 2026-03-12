import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { KafkaProducerService } from 'src/common/kafka';
import { PrismaService } from 'src/common/prisma';

const OUTBOX_BATCH_SIZE = 100;

@Injectable()
export class OutboxPublisherService {
  private readonly logger = new Logger(OutboxPublisherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {}

  /**
   * 5초마다 미발행 Outbox 이벤트를 Kafka로 발행
   *
   * DB 트랜잭션과 Kafka 발행의 원자성을 보장하는 Transactional Outbox 패턴.
   * 각 이벤트는 발행 성공 시 publishedAt을 기록하여 중복 발행을 방지합니다.
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async publishPendingEvents(): Promise<void> {
    const events = await this.prisma.outboxEvent.findMany({
      where: { publishedAt: null },
      orderBy: { createdAt: 'asc' },
      take: OUTBOX_BATCH_SIZE,
    });

    if (events.length === 0) {
      return;
    }

    for (const event of events) {
      try {
        await this.kafkaProducerService.sendMessage(
          event.eventType,
          event.payload,
          event.aggregateId,
        );

        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { publishedAt: new Date() },
        });
      } catch (error) {
        this.logger.error(`Failed to publish outbox event id=${event.id}: ${error}`);
      }
    }
  }
}
