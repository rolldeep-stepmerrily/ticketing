import { AppException } from '@@exceptions';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import bcrypt from 'bcryptjs';
import { PrismaService } from 'src/common/prisma';
import { AUTH_ERRORS } from '../../../auth.error';
import { RegisterCommand, RegisterResult } from './register.command';

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand, RegisterResult> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(command: RegisterCommand): Promise<RegisterResult> {
    const { email, password, name } = command;

    const existing = await this.prismaService.user.findUnique({ where: { email } });
    if (existing) throw new AppException(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prismaService.user.create({
      data: { email, password: hashedPassword, name },
      select: { id: true, email: true, name: true },
    });

    return user;
  }
}
