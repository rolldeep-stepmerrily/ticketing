import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext } from '@nestjs/microservices';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { ConfirmBookingUseCase } from '../../application/use-cases/confirm-booking.use-case';
import { HandleBookingCancelledUseCase } from '../../application/use-cases/handle-booking-cancelled.use-case';
import { BookingRouter } from '../http/booking.path.presenter';
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
  @EventPattern(BookingRouter.Event.BookingCreated)
  async handleBookingCreated(@Ctx() ctx: KafkaContext): Promise<void> {
    const valueStr = ctx.getMessage().value?.toString();

    if (!valueStr) {
      this.logger.warn(`Empty message on topic: ${BookingRouter.Event.BookingCreated}`);
      return;
    }

    let raw: Record<string, unknown>;

    try {
      raw = JSON.parse(valueStr) as Record<string, unknown>;
    } catch {
      this.logger.error(`Invalid JSON on topic: ${BookingRouter.Event.BookingCreated}`);
      return;
    }

    const payload = plainToInstance(BookingCreatedEventDto, raw);

    await validateOrReject(payload);

    this.logger.log(`Received event: ${BookingRouter.Event.BookingCreated}, ticketId=${payload.ticketId}`);

    await this.confirmBookingUseCase.execute({ ticketId: payload.ticketId });
  }

  /**
   * 예매 취소 이벤트 핸들러 — 취소 후속 처리
   *
   * @param {KafkaContext} ctx Kafka 컨텍스트
   */
  @EventPattern(BookingRouter.Event.BookingCancelled)
  async handleBookingCancelled(@Ctx() ctx: KafkaContext): Promise<void> {
    const valueStr = ctx.getMessage().value?.toString();

    if (!valueStr) {
      this.logger.warn(`Empty message on topic: ${BookingRouter.Event.BookingCancelled}`);
      return;
    }

    let raw: Record<string, unknown>;

    try {
      raw = JSON.parse(valueStr) as Record<string, unknown>;
    } catch {
      this.logger.error(`Invalid JSON on topic: ${BookingRouter.Event.BookingCancelled}`);
      return;
    }

    const payload = plainToInstance(BookingCancelledEventDto, raw);

    await validateOrReject(payload);

    this.logger.log(`Received event: ${BookingRouter.Event.BookingCancelled}, ticketId=${payload.ticketId}`);

    await this.handleBookingCancelledUseCase.execute(payload);
  }
}
