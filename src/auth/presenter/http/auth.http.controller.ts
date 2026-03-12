import { JwtGuard } from '@@guards';
import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { AuthRouter } from './auth.path.presenter';
import { LoginRequestBodyDto, LoginResponseDataDto } from './dto/login.dto';
import { RefreshTokenRequestBodyDto, RefreshTokenResponseDataDto } from './dto/refresh-token.dto';
import { RegisterRequestBodyDto, RegisterResponseDataDto } from './dto/register.dto';

@ApiTags(AuthRouter.HttpApiTags)
@Controller(AuthRouter.Root)
export class AuthHttpController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  /**
   * 회원가입 엔드포인트
   *
   * @param {RegisterRequestBodyDto} bodyDto 회원가입 요청 데이터
   * @returns {Promise<RegisterResponseDataDto>} 생성된 사용자 정보
   */
  @ApiOperation({ summary: '회원가입' })
  @ApiBody({ type: RegisterRequestBodyDto })
  @Post(AuthRouter.Http.Register)
  async register(@Body() bodyDto: RegisterRequestBodyDto): Promise<RegisterResponseDataDto> {
    return await this.registerUseCase.execute({ bodyDto });
  }

  /**
   * 로그인 엔드포인트
   *
   * @param {LoginRequestBodyDto} bodyDto 로그인 요청 데이터
   * @returns {Promise<LoginResponseDataDto>} 발급된 토큰 정보 (access + refresh)
   */
  @ApiOperation({ summary: '로그인' })
  @ApiBody({ type: LoginRequestBodyDto })
  @HttpCode(HttpStatus.OK)
  @Post(AuthRouter.Http.Login)
  async login(@Body() bodyDto: LoginRequestBodyDto): Promise<LoginResponseDataDto> {
    return await this.loginUseCase.execute({ bodyDto });
  }

  /**
   * 로그아웃 엔드포인트
   *
   * @param {Request} req Express 요청 객체
   * @param {RefreshTokenRequestBodyDto} bodyDto 리프레시 토큰 (선택)
   */
  @ApiOperation({ summary: '로그아웃' })
  @ApiBearerAuth('accessToken')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(AuthRouter.Http.Logout)
  async logout(@Req() req: Request, @Body() bodyDto: Partial<RefreshTokenRequestBodyDto>): Promise<void> {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

    await this.logoutUseCase.execute({ accessToken, refreshToken: bodyDto.refreshToken });
  }

  /**
   * 토큰 재발급 엔드포인트 (Refresh Token Rotation)
   *
   * @param {RefreshTokenRequestBodyDto} bodyDto 리프레시 토큰
   * @returns {Promise<RefreshTokenResponseDataDto>} 새로 발급된 토큰 쌍
   */
  @ApiOperation({ summary: '토큰 재발급 (Refresh Token Rotation)' })
  @ApiBody({ type: RefreshTokenRequestBodyDto })
  @HttpCode(HttpStatus.OK)
  @Post(AuthRouter.Http.Refresh)
  async refresh(@Body() bodyDto: RefreshTokenRequestBodyDto): Promise<RefreshTokenResponseDataDto> {
    return await this.refreshTokenUseCase.execute({ refreshToken: bodyDto.refreshToken });
  }
}
