import { SeatStatus, TicketStatus } from '@@prisma';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/common/prisma';

export class CancelTicketCommand extends Command<void> {
  constructor(public readonly props: CancelTicketCommandProps) {
    super();
  }
}

@CommandHandler(CancelTicketCommand)
export class CancelTicketCommandHandler implements ICommandHandler<CancelTicketCommand, void> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 티켓 취소 및 좌석 복구 (트랜잭션)
   *
   * @param {CancelTicketCommand} command 취소 커맨드
   */
  async execute(command: CancelTicketCommand): Promise<void> {
    const { ticketId, seatId } = command.props;

    await this.prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.CANCELLED },
      });

      await tx.seat.update({
        where: { id: seatId },
        data: { status: SeatStatus.AVAILABLE },
      });
    });
  }
}

interface CancelTicketCommandProps {
  ticketId: number;
  seatId: number;
}
