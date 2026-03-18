import { TypedCommandBus } from '@@cqrs';
import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext } from '@nestjs/microservices';
import { plainToInstance } from 'class-transformer';
import { isDefined, validateOrReject } from 'class-validator';
import { RecordInboxEventCommand } from '../../application/commands/record-inbox-event.command';
import { ConfirmBookingUseCase } from '../../application/use-cases/confirm-booking.use-case';
import { HandleBookingCancelledUseCase } from '../../application/use-cases/handle-booking-cancelled.use-case';
import { BookingEventTopic } from './booking.event.topic';
import { BookingCancelledEventDto } from './dto/booking-cancelled.event.dto';
import { BookingCreatedEventDto } from './dto/booking-created.event.dto';

@Controller()
export class BookingEventController {
  private readonly logger = new Logger(BookingEventController.name);

  constructor(
    private readonly confirmBookingUseCase: ConfirmBookingUseCase,
    private readonly handleBookingCancelledUseCase: HandleBookingCancelledUseCase,
    private readonly commandBus: TypedCommandBus<RecordInboxEventCommand>,
  ) {}

  /**
   * 예매 생성 이벤트 핸들러 — 티켓 확정 처리
   *
   * @param {KafkaContext} ctx Kafka 컨텍스트
   */
  @EventPattern(BookingEventTopic.BookingCreated)
  async handleBookingCreated(@Ctx() ctx: KafkaContext): Promise<void> {
    const raw = this.parseMessage(ctx, BookingEventTopic.BookingCreated);

    if (!raw) {
      return;
    }

    const payload = plainToInstance(BookingCreatedEventDto, raw);

    try {
      await validateOrReject(payload);
    } catch (errors) {
      this.logger.error(`Invalid payload on topic: ${BookingEventTopic.BookingCreated}`, JSON.stringify(errors));

      return;
    }

    const isRecorded = await this.tryRecordInboxEvent(payload.eventId, BookingEventTopic.BookingCreated);

    if (!isRecorded) {
      return;
    }

    this.logger.log(`Received event: ${BookingEventTopic.BookingCreated}, ticketId=${payload.ticketId}`);

    await this.confirmBookingUseCase.execute({ ticketId: payload.ticketId });
  }

  /**
   * 예매 취소 이벤트 핸들러 — 취소 후속 처리
   *
   * @param {KafkaContext} ctx Kafka 컨텍스트
   */
  @EventPattern(BookingEventTopic.BookingCancelled)
  async handleBookingCancelled(@Ctx() ctx: KafkaContext): Promise<void> {
    const raw = this.parseMessage(ctx, BookingEventTopic.BookingCancelled);

    if (!raw) {
      return;
    }

    const payload = plainToInstance(BookingCancelledEventDto, raw);

    try {
      await validateOrReject(payload);
    } catch (errors) {
      this.logger.error(`Invalid payload on topic: ${BookingEventTopic.BookingCancelled}`, JSON.stringify(errors));

      return;
    }

    const isRecorded = await this.tryRecordInboxEvent(payload.eventId, BookingEventTopic.BookingCancelled);

    if (!isRecorded) {
      return;
    }

    this.logger.log(`Received event: ${BookingEventTopic.BookingCancelled}, ticketId=${payload.ticketId}`);

    await this.handleBookingCancelledUseCase.execute(payload);
  }

  /**
   * Inbox 이벤트 기록 시도 — PK 중복 시 false 반환으로 멱등성 보장
   *
   * @param {string} eventId 이벤트 고유 ID
   * @param {string} eventType 이벤트 타입
   * @returns {Promise<boolean>} 신규 이벤트면 true, 중복이면 false
   */
  private async tryRecordInboxEvent(eventId: string, eventType: string): Promise<boolean> {
    try {
      await this.commandBus.execute(new RecordInboxEventCommand({ eventId, eventType }));

      return true;
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        this.logger.warn(`Duplicate event skipped: eventId=${eventId}, topic=${eventType}`);

        return false;
      }

      throw error;
    }
  }

  /**
   * Prisma unique constraint 위반 에러 여부 확인
   *
   * @param {unknown} error 에러 객체
   * @returns {boolean} P2002 에러면 true
   */
  private isDuplicateKeyError(error: unknown): boolean {
    return (
      isDefined(error) &&
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }

  /**
   * Kafka 메시지 파싱 (빈 메시지 및 JSON 파싱 에러 처리)
   *
   * @param {KafkaContext} ctx Kafka 컨텍스트
   * @param {string} topic 토픽명
   * @returns {Record<string, unknown> | null} 파싱된 객체 또는 null
   */
  private parseMessage(ctx: KafkaContext, topic: string): Record<string, unknown> | null {
    const valueStr = ctx.getMessage().value?.toString();

    if (!isDefined(valueStr) || valueStr === '') {
      this.logger.warn(`Empty message on topic: ${topic}`);

      return null;
    }

    try {
      return JSON.parse(valueStr) as Record<string, unknown>;
    } catch {
      this.logger.error(`Invalid JSON on topic: ${topic}`);

      return null;
    }
  }
}
