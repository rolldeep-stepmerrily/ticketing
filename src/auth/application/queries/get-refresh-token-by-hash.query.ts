import { PrismaService } from '@@db';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

interface RefreshTokenRecord {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
}

export class GetRefreshTokenByHashQuery extends Query<RefreshTokenRecord | null> {
  constructor(public readonly props: GetRefreshTokenByHashQueryProps) {
    super();
  }
}

@QueryHandler(GetRefreshTokenByHashQuery)
export class GetRefreshTokenByHashQueryHandler
  implements IQueryHandler<GetRefreshTokenByHashQuery, RefreshTokenRecord | null>
{
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 해시로 Refresh token 조회
   *
   * @param {GetRefreshTokenByHashQuery} query 조회 쿼리
   * @returns {Promise<RefreshTokenRecord | null>} 토큰 정보 또는 null
   */
  async execute(query: GetRefreshTokenByHashQuery): Promise<RefreshTokenRecord | null> {
    return await this.prisma.refreshToken.findUnique({
      where: { tokenHash: query.props.tokenHash },
      select: { id: true, userId: true, tokenHash: true, expiresAt: true },
    });
  }
}

interface GetRefreshTokenByHashQueryProps {
  tokenHash: string;
}
