import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { isDefined } from 'class-validator';
import type ms from 'ms';
import { TypedCommandBus, TypedQueryBus } from 'src/common/cqrs';
import { AUTH_ERRORS } from '../../auth.error';
import { RefreshTokenResponseDataDto } from '../../presenter/http/dto/refresh-token.dto';
import { CreateRefreshTokenCommand } from '../commands/create-refresh-token.command';
import { DeleteRefreshTokenCommand } from '../commands/delete-refresh-token.command';
import { GetRefreshTokenByHashQuery } from '../queries/get-refresh-token-by-hash.query';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly queryBus: TypedQueryBus<GetRefreshTokenByHashQuery>,
    private readonly commandBus: TypedCommandBus<CreateRefreshTokenCommand | DeleteRefreshTokenCommand>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Refresh token으로 새 토큰 쌍 발급 (Rotation)
   *
   * @param {RefreshTokenUseCaseProps} props 리프레시 요청 데이터
   * @returns {Promise<RefreshTokenResponseDataDto>} 새로 발급된 토큰 정보
   * @throws {AppException} 유효하지 않거나 만료된 refresh token인 경우
   */
  async execute(props: RefreshTokenUseCaseProps): Promise<RefreshTokenResponseDataDto> {
    const { refreshToken } = props;

    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.findAndValidateToken(tokenHash);

    await this.commandBus.execute(new DeleteRefreshTokenCommand({ tokenHash }));

    const newTokens = await this.issueTokenPair(storedToken.userId);

    return RefreshTokenResponseDataDto.from(newTokens);
  }

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
   * 랜덤 Refresh token 생성
   *
   * @returns {string} 랜덤 hex 토큰
   */
  generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
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
   * DB에서 refresh token 조회 및 만료 여부 검증
   *
   * @param {string} tokenHash 토큰 해시
   * @returns {Promise<{ userId: number }>} 저장된 토큰 정보
   * @throws {AppException} 토큰이 없거나 만료된 경우
   */
  private async findAndValidateToken(tokenHash: string): Promise<{ userId: number }> {
    const stored = await this.queryBus.execute(new GetRefreshTokenByHashQuery({ tokenHash }));

    if (!isDefined(stored)) {
      throw new AppException(AUTH_ERRORS.REFRESH_TOKEN_INVALID);
    }

    if (stored.expiresAt < new Date()) {
      throw new AppException(AUTH_ERRORS.REFRESH_TOKEN_INVALID);
    }

    return { userId: stored.userId };
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
      return new Date(Date.now() + 7 * 86_400_000);
    }

    const value = Number(match[1]);
    const unit = match[2] as keyof typeof msMap;

    return new Date(Date.now() + value * msMap[unit]);
  }
}

interface RefreshTokenUseCaseProps {
  refreshToken: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}
