import { TypedCommandBus } from '@@cqrs';
import { AppException, GLOBAL_ERRORS } from '@@exceptions';
import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type ms from 'ms';
import { CreateRefreshTokenCommand } from '../commands/create-refresh-token.command';

@Injectable()
export class TokenService {
  constructor(
    private readonly commandBus: TypedCommandBus<CreateRefreshTokenCommand>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 토큰 해시 계산
   *
   * @param {string} token 원본 토큰
   * @returns {string} SHA-256 해시
   */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Access token + Refresh token 쌍 발급 및 DB 저장
   *
   * @param {number} userId 사용자 ID
   * @returns {Promise<TokenPair>} 발급된 토큰 쌍
   */
  async issueTokenPair(userId: number): Promise<TokenPair> {
    const accessExpiresIn = this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN');
    const refreshExpiresIn = this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN');

    const accessToken = this.jwtService.sign({ sub: userId }, { expiresIn: accessExpiresIn as ms.StringValue });

    const rawRefreshToken = this.generateRefreshToken();
    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const refreshExpiresAt = this.computeExpiresAt(refreshExpiresIn);

    await this.commandBus.execute(
      new CreateRefreshTokenCommand({ userId, tokenHash: refreshTokenHash, expiresAt: refreshExpiresAt }),
    );

    return { accessToken, refreshToken: rawRefreshToken, accessExpiresIn, refreshExpiresIn };
  }

  /**
   * 랜덤 Refresh token 생성
   *
   * @returns {string} 랜덤 hex 토큰
   */
  private generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  /**
   * 만료 시간 문자열을 Date로 변환
   *
   * @param {string} expiresIn 만료 시간 (예: "7d", "15m")
   * @returns {Date} 만료 시각
   */
  private computeExpiresAt(expiresIn: string): Date {
    const msMap: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      throw new AppException(GLOBAL_ERRORS.UNKNOWN_ERROR);
    }

    const value = Number(match[1]);
    const unit = match[2] as keyof typeof msMap;

    return new Date(Date.now() + value * msMap[unit]);
  }
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}
