import { PrismaService } from '@@db';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class RecordInboxEventCommand extends Command<void> {
  constructor(public readonly props: RecordInboxEventCommandProps) {
    super();
  }
}

@CommandHandler(RecordInboxEventCommand)
export class RecordInboxEventCommandHandler implements ICommandHandler<RecordInboxEventCommand, void> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inbox 이벤트 처리 기록 저장
   *
   * @param {RecordInboxEventCommand} command 기록 커맨드
   */
  async execute(command: RecordInboxEventCommand): Promise<void> {
    const { eventId, eventType } = command.props;

    await this.prisma.inboxEvent.create({
      data: { id: eventId, eventType },
    });
  }
}

interface RecordInboxEventCommandProps {
  eventId: string;
  eventType: string;
}
