import { PrismaService } from '@@db';
import { TicketStatus } from '@@prisma';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class ConfirmTicketCommand extends Command<void> {
  constructor(public readonly props: ConfirmTicketCommandProps) {
    super();
  }
}

@CommandHandler(ConfirmTicketCommand)
export class ConfirmTicketCommandHandler implements ICommandHandler<ConfirmTicketCommand, void> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * PENDING 상태의 티켓을 CONFIRMED로 변경
   *
   * @param {ConfirmTicketCommand} command 확정 커맨드
   */
  async execute(command: ConfirmTicketCommand): Promise<void> {
    const { ticketId } = command.props;

    await this.prisma.ticket.updateMany({
      where: { id: ticketId, status: TicketStatus.PENDING },
      data: { status: TicketStatus.CONFIRMED },
    });
  }
}

interface ConfirmTicketCommandProps {
  ticketId: number;
}
