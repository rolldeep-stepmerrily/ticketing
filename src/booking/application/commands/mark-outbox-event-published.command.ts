import { PrismaService } from '@@db';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class MarkOutboxEventPublishedCommand extends Command<void> {
  constructor(public readonly props: MarkOutboxEventPublishedCommandProps) {
    super();
  }
}

@CommandHandler(MarkOutboxEventPublishedCommand)
export class MarkOutboxEventPublishedCommandHandler
  implements ICommandHandler<MarkOutboxEventPublishedCommand, void>
{
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Outbox 이벤트 발행 완료 처리
   *
   * @param {MarkOutboxEventPublishedCommand} command 발행 완료 커맨드
   */
  async execute(command: MarkOutboxEventPublishedCommand): Promise<void> {
    const { eventId } = command.props;

    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: { publishedAt: new Date() },
    });
  }
}

interface MarkOutboxEventPublishedCommandProps {
  eventId: number;
}
