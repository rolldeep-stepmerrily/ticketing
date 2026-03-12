import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/common/prisma';

export class CreateRefreshTokenCommand extends Command<void> {
  constructor(public readonly props: CreateRefreshTokenCommandProps) {
    super();
  }
}

@CommandHandler(CreateRefreshTokenCommand)
export class CreateRefreshTokenCommandHandler implements ICommandHandler<CreateRefreshTokenCommand, void> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Refresh token 저장 (기존 토큰 교체)
   *
   * @param {CreateRefreshTokenCommand} command 생성 커맨드
   */
  async execute(command: CreateRefreshTokenCommand): Promise<void> {
    const { userId, tokenHash, expiresAt } = command.props;

    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
      this.prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } }),
    ]);
  }
}

interface CreateRefreshTokenCommandProps {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
}
