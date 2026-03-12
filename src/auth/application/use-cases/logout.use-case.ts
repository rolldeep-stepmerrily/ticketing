import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isDefined } from 'class-validator';

import { RedisService } from 'src/common/redis';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 로그아웃 실행 — Access token을 블랙리스트에 등록
   *
   * @param {LogoutUseCaseProps} props 로그아웃 요청 데이터
   */
  async execute(props: LogoutUseCaseProps): Promise<void> {
    await this.blacklistToken(props.accessToken);
  }

  /**
   * Access token을 Redis 블랙리스트에 추가
   *
   * @param {string} token 무효화할 Access token
   */
  private async blacklistToken(token: string): Promise<void> {
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
}

interface LogoutUseCaseProps {
  accessToken: string;
}
