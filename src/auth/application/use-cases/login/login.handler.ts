import { AppException } from '@@exceptions';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from 'src/common/prisma';
import { AUTH_ERRORS } from '../../../auth.error';
import { LoginCommand, LoginResult } from './login.command';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, LoginResult> {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const { email, password } = command;

    const user = await this.prismaService.user.findUnique({ where: { email, deletedAt: null } });
    if (!user) throw new AppException(AUTH_ERRORS.INVALID_CREDENTIALS);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new AppException(AUTH_ERRORS.INVALID_CREDENTIALS);

    const expiresIn = this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN');
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });

    return { accessToken, expiresIn };
  }
}
