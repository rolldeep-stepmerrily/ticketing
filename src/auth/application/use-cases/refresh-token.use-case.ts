import { TypedCommandBus, TypedQueryBus } from '@@cqrs';
import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { AUTH_ERRORS } from '../../auth.error';
import { RefreshTokenResponseDataDto } from '../../presenter/http/dto/refresh-token.dto';
import { DeleteRefreshTokenCommand } from '../commands/delete-refresh-token.command';
import { GetRefreshTokenByHashQuery } from '../queries/get-refresh-token-by-hash.query';
import { TokenService } from '../services/token.service';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly queryBus: TypedQueryBus<GetRefreshTokenByHashQuery>,
    private readonly commandBus: TypedCommandBus<DeleteRefreshTokenCommand>,
    private readonly tokenService: TokenService,
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

    const tokenHash = this.tokenService.hashToken(refreshToken);
    const storedToken = await this.findAndValidateToken(tokenHash);

    await this.commandBus.execute(new DeleteRefreshTokenCommand({ tokenHash }));

    const newTokens = await this.tokenService.issueTokenPair(storedToken.userId);

    return RefreshTokenResponseDataDto.from(newTokens);
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
}

interface RefreshTokenUseCaseProps {
  refreshToken: string;
}
