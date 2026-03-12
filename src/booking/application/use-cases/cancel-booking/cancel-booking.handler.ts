import { AppException } from '@@exceptions';
import { SeatStatus, TicketStatus } from '@@prisma';
import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { KafkaProducerService } from 'src/common/kafka';
import { PrismaService } from 'src/common/prisma';
import { RedisService } from 'src/common/redis';
import { BOOKING_ERRORS } from '../../../booking.error';
import { CancelBookingCommand } from './cancel-booking.command';

const SEAT_STOCK_PREFIX = 'ticketing:seat:';
const TOPIC_BOOKING_CANCELLED = 'ticketing.booking.cancelled';

@CommandHandler(CancelBookingCommand)
export class CancelBookingHandler implements ICommandHandler<CancelBookingCommand, void> {
  private readonly logger = new Logger(CancelBookingHandler.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {}

  async execute(command: CancelBookingCommand): Promise<void> {
    const { userId, ticketId } = command;

    const ticket = await this.prismaService.ticket.findFirst({
      where: { id: ticketId, userId },
      include: { seat: true },
    });

    if (!ticket) throw new AppException(BOOKING_ERRORS.TICKET_NOT_FOUND);

    const isCancellable = ticket.status === TicketStatus.PENDING || ticket.status === TicketStatus.CONFIRMED;
    if (!isCancellable) throw new AppException(BOOKING_ERRORS.TICKET_NOT_CANCELLABLE);

    // DB 트랜잭션: 티켓 취소 + 좌석 복구
    await this.prismaService.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.CANCELLED },
      });

      await tx.seat.update({
        where: { id: ticket.seatId },
        data: { status: SeatStatus.AVAILABLE },
      });
    });

    // Redis 재고 복구
    const stockKey = `${SEAT_STOCK_PREFIX}${ticket.seatId}:stock`;
    await this.redisService.incrementStock(stockKey);

    // Kafka 이벤트 발행: ticketing.booking.cancelled
    await this.kafkaProducerService.sendMessage(
      TOPIC_BOOKING_CANCELLED,
      { ticketId, userId, seatId: ticket.seatId, concertId: ticket.seat.concertId },
      String(ticket.seatId),
    );

    this.logger.log(`Booking cancelled: ticketId=${ticketId}, userId=${userId}`);
  }
}
