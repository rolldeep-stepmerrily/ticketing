import { TypedCommandBus } from '@@cqrs';
import { KafkaConsumerService } from '@@kafka';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { ConfirmTicketCommand } from './application/commands/confirm-ticket.command';

const TOPIC_BOOKING_CREATED = 'ticketing.booking.created';

interface BookingCreatedPayload {
  ticketId: number;
  userId: number;
  seatId: number;
  concertId: number;
}

@Injectable()
export class BookingConfirmConsumer implements OnModuleInit {
  private readonly logger = new Logger(BookingConfirmConsumer.name);

  constructor(
    private readonly kafkaConsumerService: KafkaConsumerService,
    private readonly commandBus: TypedCommandBus<ConfirmTicketCommand>,
  ) {}

  /**
   * 모듈 초기화 시 Kafka 토픽 구독 등록
   */
  async onModuleInit(): Promise<void> {
    await this.kafkaConsumerService.subscribe(
      { topics: [TOPIC_BOOKING_CREATED], fromBeginning: false },
      async ({ message }) => {
        await this.handleBookingCreated(message);
      },
    );
  }

  /**
   * 예매 생성 이벤트 처리 — 티켓 상태를 CONFIRMED로 변경
   *
   * @param {{ value: Buffer | null }} message Kafka 메시지
   */
  private async handleBookingCreated(message: { value: Buffer | null }): Promise<void> {
    if (!isDefined(message.value)) {
      return;
    }

    const payload = JSON.parse(message.value.toString()) as BookingCreatedPayload;

    await this.commandBus.execute(new ConfirmTicketCommand({ ticketId: payload.ticketId }));

    this.logger.log(`Ticket confirmed: ticketId=${payload.ticketId}`);
  }
}
