import { TypedCommandBus } from '@@cqrs';
import { RedisService } from '@@redis';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isDefined } from 'class-validator';
import { DeleteRefreshTokenCommand } from '../commands/delete-refresh-token.command';
import { RefreshTokenUseCase } from './refresh-token.use-case';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly commandBus: TypedCommandBus<DeleteRefreshTokenCommand>,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  /**
   * 로그아웃 실행 — Access token 블랙리스트 등록 + Refresh token 삭제
   *
   * @param {LogoutUseCaseProps} props 로그아웃 요청 데이터
   */
  async execute(props: LogoutUseCaseProps): Promise<void> {
    await this.blacklistAccessToken(props.accessToken);
    await this.revokeRefreshToken(props.refreshToken);
  }

  /**
   * Access token을 Redis 블랙리스트에 추가
   *
   * @param {string} token 무효화할 Access token
   */
  private async blacklistAccessToken(token: string): Promise<void> {
    if (!token) {
      return;
    }

    const decoded = this.jwtService.decode(token) as { exp?: number } | null;

    if (!isDefined(decoded?.exp) || decoded.exp === undefined) {
      return;
    }

    const ttlSeconds = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));

    await this.redisService.addToBlacklist(token, ttlSeconds);
  }

  /**
   * Refresh token을 DB에서 삭제
   *
   * @param {string | undefined} refreshToken 삭제할 Refresh token
   */
  private async revokeRefreshToken(refreshToken: string | undefined): Promise<void> {
    if (!isDefined(refreshToken)) {
      return;
    }

    const tokenHash = this.refreshTokenUseCase.hashToken(refreshToken);

    await this.commandBus.execute(new DeleteRefreshTokenCommand({ tokenHash }));
  }
}

interface LogoutUseCaseProps {
  accessToken: string;
  refreshToken?: string;
}
