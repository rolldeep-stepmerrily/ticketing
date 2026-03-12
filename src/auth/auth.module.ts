import { Module } from '@nestjs/common';

import { JwtGuard } from 'src/common/guards';
import { LoginHandler } from './application/use-cases/login/login.handler';
import { LogoutHandler } from './application/use-cases/logout/logout.handler';
import { RegisterHandler } from './application/use-cases/register/register.handler';
import { AuthHttpController } from './presenter/http/auth.http-controller';

@Module({
  controllers: [AuthHttpController],
  providers: [RegisterHandler, LoginHandler, LogoutHandler, JwtGuard],
})
export class AuthModule {}
