import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/common/prisma';

export class CreateUserCommand extends Command<CreateUserResult> {
  constructor(public readonly props: CreateUserCommandProps) {
    super();
  }
}

@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand, CreateUserResult> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 사용자 생성
   *
   * @param {CreateUserCommand} command 생성 커맨드
   * @returns {Promise<CreateUserResult>} 생성된 사용자
   */
  async execute(command: CreateUserCommand): Promise<CreateUserResult> {
    const { email, password, name } = command.props;

    return await this.prisma.user.create({
      data: { email, password, name },
      select: { id: true, email: true, name: true },
    });
  }
}

interface CreateUserCommandProps {
  email: string;
  password: string;
  name: string;
}

interface CreateUserResult {
  id: number;
  email: string;
  name: string;
}
