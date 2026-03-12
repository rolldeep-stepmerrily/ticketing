import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/common/prisma';

export class GetUserByEmailQuery extends Query<GetUserByEmailResult | null> {
  constructor(public readonly props: GetUserByEmailQueryProps) {
    super();
  }
}

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailQueryHandler implements IQueryHandler<GetUserByEmailQuery, GetUserByEmailResult | null> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 이메일로 사용자 조회
   *
   * @param {GetUserByEmailQuery} query 조회 쿼리
   * @returns {Promise<GetUserByEmailResult | null>} 사용자 정보 또는 null
   */
  async execute(query: GetUserByEmailQuery): Promise<GetUserByEmailResult | null> {
    return await this.prisma.user.findUnique({
      where: { email: query.props.email, deletedAt: null },
    });
  }
}

interface GetUserByEmailQueryProps {
  email: string;
}

interface GetUserByEmailResult {
  id: number;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}
