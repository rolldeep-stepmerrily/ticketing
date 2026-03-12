import { Module } from '@nestjs/common';

import { JwtGuard } from '@@guards';
import { CreateRefreshTokenCommandHandler } from './application/commands/create-refresh-token.command';
import { DeleteRefreshTokenCommandHandler } from './application/commands/delete-refresh-token.command';
import { CreateUserCommandHandler } from './application/commands/create-user.command';
import { GetRefreshTokenByHashQueryHandler } from './application/queries/get-refresh-token-by-hash.query';
import { GetUserByEmailQueryHandler } from './application/queries/get-user-by-email.query';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { AuthHttpController } from './presenter/http/auth.http.controller';

@Module({
  controllers: [AuthHttpController],
  providers: [
    /** query-handlers */
    GetUserByEmailQueryHandler,
    GetRefreshTokenByHashQueryHandler,

    /** command-handlers */
    CreateUserCommandHandler,
    CreateRefreshTokenCommandHandler,
    DeleteRefreshTokenCommandHandler,

    /** use-cases */
    RegisterUseCase,
    LoginUseCase,
    LogoutUseCase,
    RefreshTokenUseCase,

    JwtGuard,
  ],
})
export class AuthModule {}
