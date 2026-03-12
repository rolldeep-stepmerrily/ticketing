import { SeatStatus, TicketStatus } from '@@prisma';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/common/prisma';

export class CreateTicketCommand extends Command<CreateTicketResult> {
  constructor(public readonly props: CreateTicketCommandProps) {
    super();
  }
}

@CommandHandler(CreateTicketCommand)
export class CreateTicketCommandHandler implements ICommandHandler<CreateTicketCommand, CreateTicketResult> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 좌석 상태 변경 및 티켓 생성 (트랜잭션)
   *
   * @param {CreateTicketCommand} command 생성 커맨드
   * @returns {Promise<CreateTicketResult>} 생성된 티켓
   */
  async execute(command: CreateTicketCommand): Promise<CreateTicketResult> {
    const { userId, seatId } = command.props;

    return await this.prisma.$transaction(async (tx) => {
      await tx.seat.update({
        where: { id: seatId, status: SeatStatus.AVAILABLE },
        data: { status: SeatStatus.RESERVED },
      });

      return await tx.ticket.create({
        data: { userId, seatId, status: TicketStatus.PENDING },
        select: { id: true, seatId: true, status: true, createdAt: true },
      });
    });
  }
}

interface CreateTicketCommandProps {
  userId: number;
  seatId: number;
}

interface CreateTicketResult {
  id: number;
  seatId: number;
  status: string;
  createdAt: Date;
}
