import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';

import { RedisService } from 'src/common/redis';
import { LogoutCommand } from './logout.command';

interface JwtPayload {
  sub: number;
  email: string;
  iat: number;
  exp: number;
}

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand, void> {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const decoded = this.jwtService.decode<JwtPayload>(command.token);
    if (!decoded) return;

    const remainingTtl = decoded.exp - Math.floor(Date.now() / 1000);
    await this.redisService.addToBlacklist(command.token, remainingTtl);
  }
}
