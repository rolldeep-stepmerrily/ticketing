import { PrismaService } from '@@db';
import { AppException } from '@@exceptions';
import { SeatStatus, TicketStatus } from '@@prisma';
import { RedisService } from '@@redis';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BOOKING_ERRORS } from '../../booking.error';
import { BookingEventTopic } from '../../presenter/event/booking.event.topic';

const SEAT_STOCK_KEY_PREFIX = 'ticketing:seat:';
const CANCEL_TX_TIMEOUT_MS = 15_000;

export class CancelTicketCommand extends Command<void> {
  constructor(public readonly props: CancelTicketCommandProps) {
    super();
  }
}

@CommandHandler(CancelTicketCommand)
export class CancelTicketCommandHandler implements ICommandHandler<CancelTicketCommand, void> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 티켓 취소, 좌석 복구, Outbox 기록, Redis 재고 복구 (원자적 트랜잭션)
   *
   * Redis INCR 실패 시 트랜잭션이 롤백되어 좌석이 영구 잠기는 상황을 방지합니다.
   *
   * @param {CancelTicketCommand} command 취소 커맨드
   */
  async execute(command: CancelTicketCommand): Promise<void> {
    const { ticketId, seatId, userId, concertId } = command.props;

    await this.prisma.$transaction(
      async (tx) => {
        const updateResult = await tx.ticket.updateMany({
          where: { id: ticketId, status: { in: [TicketStatus.PENDING, TicketStatus.CONFIRMED] } },
          data: { status: TicketStatus.CANCELLED },
        });

        if (updateResult.count === 0) {
          throw new AppException(BOOKING_ERRORS.TICKET_NOT_CANCELLABLE);
        }

        await tx.seat.update({
          where: { id: seatId },
          data: { status: SeatStatus.AVAILABLE },
        });

        await tx.outboxEvent.create({
          data: {
            aggregateId: String(ticketId),
            eventType: BookingEventTopic.BookingCancelled,
            payload: { ticketId, userId, seatId, concertId },
          },
        });

        await this.redisService.incrementStock(`${SEAT_STOCK_KEY_PREFIX}${seatId}:stock`);
      },
      { timeout: CANCEL_TX_TIMEOUT_MS },
    );
  }
}

interface CancelTicketCommandProps {
  ticketId: number;
  seatId: number;
  userId: number;
  concertId: number;
}
