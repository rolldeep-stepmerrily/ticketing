import { Module } from '@nestjs/common';

import { JwtGuard } from 'src/common/guards';
import { CreateUserCommandHandler } from './application/commands/create-user.command';
import { GetUserByEmailQueryHandler } from './application/queries/get-user-by-email.query';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { AuthHttpController } from './presenter/http/auth.http.controller';

@Module({
  controllers: [AuthHttpController],
  providers: [
    /** query-handlers */
    GetUserByEmailQueryHandler,

    /** command-handlers */
    CreateUserCommandHandler,

    /** use-cases */
    RegisterUseCase,
    LoginUseCase,
    LogoutUseCase,

    JwtGuard,
  ],
})
export class AuthModule {}
