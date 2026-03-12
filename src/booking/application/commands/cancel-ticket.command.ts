import { PrismaService } from '@@db';
import { SeatStatus, TicketStatus } from '@@prisma';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CancelTicketCommand extends Command<void> {
  constructor(public readonly props: CancelTicketCommandProps) {
    super();
  }
}

@CommandHandler(CancelTicketCommand)
export class CancelTicketCommandHandler implements ICommandHandler<CancelTicketCommand, void> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 티켓 취소, 좌석 복구, Outbox 이벤트 기록 (원자적 트랜잭션)
   *
   * @param {CancelTicketCommand} command 취소 커맨드
   */
  async execute(command: CancelTicketCommand): Promise<void> {
    const { ticketId, seatId, userId, concertId } = command.props;

    await this.prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.CANCELLED },
      });

      await tx.seat.update({
        where: { id: seatId },
        data: { status: SeatStatus.AVAILABLE },
      });

      await tx.outboxEvent.create({
        data: {
          aggregateId: String(ticketId),
          eventType: 'ticketing.booking.cancelled',
          payload: { ticketId, userId, seatId, concertId },
        },
      });
    });
  }
}

interface CancelTicketCommandProps {
  ticketId: number;
  seatId: number;
  userId: number;
  concertId: number;
}
