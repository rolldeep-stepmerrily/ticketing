import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { TypedCommandBus } from 'src/common/cqrs';
import { JwtGuard } from 'src/common/guards';
import { LoginCommand, LoginResult } from '../../application/use-cases/login/login.command';
import { LogoutCommand } from '../../application/use-cases/logout/logout.command';
import { RegisterCommand, RegisterResult } from '../../application/use-cases/register/register.command';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type AuthCommand = RegisterCommand | LoginCommand | LogoutCommand;

@ApiTags('auth')
@Controller('auth')
export class AuthHttpController {
  constructor(private readonly commandBus: TypedCommandBus<AuthCommand>) {}

  @ApiOperation({ summary: '회원가입' })
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<RegisterResult> {
    return await this.commandBus.execute(new RegisterCommand(dto.email, dto.password, dto.name));
  }

  @ApiOperation({ summary: '로그인' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<LoginResult> {
    return await this.commandBus.execute(new LoginCommand(dto.email, dto.password));
  }

  @ApiOperation({ summary: '로그아웃' })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard)
  async logout(@Req() req: Request): Promise<void> {
    const parts = req.headers.authorization?.split(' ') ?? [];
    const token = parts[1] ?? '';
    await this.commandBus.execute(new LogoutCommand(token));
  }
}
