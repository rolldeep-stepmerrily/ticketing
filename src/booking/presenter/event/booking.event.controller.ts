import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext } from '@nestjs/microservices';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
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

    this.logger.log(`Received event: ${BookingEventTopic.BookingCancelled}, ticketId=${payload.ticketId}`);

    await this.handleBookingCancelledUseCase.execute(payload);
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

    if (!valueStr) {
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
