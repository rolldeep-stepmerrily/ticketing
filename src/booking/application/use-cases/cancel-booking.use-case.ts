import { AppException } from '@@exceptions';
import { TicketStatus } from '@@prisma';
import { Injectable, Logger } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { TypedCommandBus } from 'src/common/cqrs';
import { KafkaProducerService } from 'src/common/kafka';
import { PrismaService } from 'src/common/prisma';
import { RedisService } from 'src/common/redis';
import { BOOKING_ERRORS } from '../../booking.error';
import { CancelTicketCommand } from '../commands/cancel-ticket.command';

const SEAT_STOCK_KEY_PREFIX = 'ticketing:seat:';
const TOPIC_BOOKING_CANCELLED = 'ticketing.booking.cancelled';

@Injectable()
export class CancelBookingUseCase {
  private readonly logger = new Logger(CancelBookingUseCase.name);

  constructor(
    private readonly commandBus: TypedCommandBus<CancelTicketCommand>,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {}

  /**
   * 예매 취소 실행
   *
   * @param {CancelBookingUseCaseProps} props 취소 요청 데이터
   * @throws {AppException} 티켓 없음 또는 취소 불가 상태인 경우
   */
  async execute(props: CancelBookingUseCaseProps): Promise<void> {
    const { userId, ticketId } = props;

    const ticket = await this.findTicket({ userId, ticketId });

    this.validateCancellable(ticket);

    await this.cancelTicket({ ticketId, seatId: ticket.seatId });

    await this.restoreSeatStock(ticket.seatId);

    await this.publishBookingCancelled({ ticketId, userId, seatId: ticket.seatId, concertId: ticket.seat.concertId });

    this.logger.log(`Booking cancelled: ticketId=${ticketId}, userId=${userId}`);
  }

  /**
   * 티켓 조회 (소유자 확인 포함)
   *
   * @param {{ userId: number; ticketId: number }} params 조회 파라미터
   * @returns {Promise<TicketWithSeat>} 티켓 정보
   * @throws {AppException} 티켓이 없거나 소유자가 다른 경우
   */
  private async findTicket(params: { userId: number; ticketId: number }): Promise<TicketWithSeat> {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: params.ticketId, userId: params.userId },
      include: { seat: true },
    });

    if (!isDefined(ticket)) {
      throw new AppException(BOOKING_ERRORS.TICKET_NOT_FOUND);
    }

    return ticket;
  }

  /**
   * 티켓 취소 가능 여부 검증
   *
   * @param {TicketWithSeat} ticket 티켓 정보
   * @throws {AppException} 취소 불가 상태인 경우
   */
  private validateCancellable(ticket: TicketWithSeat): void {
    const isCancellable = ticket.status === TicketStatus.PENDING || ticket.status === TicketStatus.CONFIRMED;

    if (!isCancellable) {
      throw new AppException(BOOKING_ERRORS.TICKET_NOT_CANCELLABLE);
    }
  }

  /**
   * DB 트랜잭션으로 티켓 취소 및 좌석 복구
   *
   * @param {{ ticketId: number; seatId: number }} params 취소 데이터
   */
  private async cancelTicket(params: { ticketId: number; seatId: number }): Promise<void> {
    await this.commandBus.execute(new CancelTicketCommand(params));
  }

  /**
   * Redis 좌석 재고 복구 (INCR)
   *
   * @param {number} seatId 좌석 ID
   */
  private async restoreSeatStock(seatId: number): Promise<void> {
    const stockKey = `${SEAT_STOCK_KEY_PREFIX}${seatId}:stock`;

    await this.redisService.incrementStock(stockKey);
  }

  /**
   * Kafka에 예매 취소 이벤트 발행
   *
   * @param {{ ticketId: number; userId: number; seatId: number; concertId: number }} payload 이벤트 데이터
   */
  private async publishBookingCancelled(payload: {
    ticketId: number;
    userId: number;
    seatId: number;
    concertId: number;
  }): Promise<void> {
    await this.kafkaProducerService.sendMessage(TOPIC_BOOKING_CANCELLED, payload, String(payload.seatId));
  }
}

interface CancelBookingUseCaseProps {
  userId: number;
  ticketId: number;
}

interface TicketWithSeat {
  id: number;
  userId: number;
  seatId: number;
  status: string;
  seat: { concertId: number };
}
