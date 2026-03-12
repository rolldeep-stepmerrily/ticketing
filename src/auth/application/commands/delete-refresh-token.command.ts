import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { PrismaService } from '@@db';

export class DeleteRefreshTokenCommand extends Command<void> {
  constructor(public readonly props: DeleteRefreshTokenCommandProps) {
    super();
  }
}

@CommandHandler(DeleteRefreshTokenCommand)
export class DeleteRefreshTokenCommandHandler implements ICommandHandler<DeleteRefreshTokenCommand, void> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Refresh token 삭제
   *
   * @param {DeleteRefreshTokenCommand} command 삭제 커맨드
   */
  async execute(command: DeleteRefreshTokenCommand): Promise<void> {
    const { tokenHash } = command.props;

    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }
}

interface DeleteRefreshTokenCommandProps {
  tokenHash: string;
}
