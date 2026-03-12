/** biome-ignore-all lint/suspicious/noExplicitAny: @nestjs/jwt v11 expiresIn 타입 이슈 */

import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { isDefined } from 'class-validator';
import { TypedQueryBus } from 'src/common/cqrs';
import { AUTH_ERRORS } from '../../auth.error';
import { LoginRequestBodyDto, LoginResponseDataDto } from '../../presenter/http/dto/login.dto';
import { GetUserByEmailQuery } from '../queries/get-user-by-email.query';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly queryBus: TypedQueryBus<GetUserByEmailQuery>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 로그인 실행
   *
   * @param {LoginUseCaseProps} props 로그인 요청 데이터
   * @returns {Promise<LoginResponseDataDto>} 발급된 토큰 정보
   * @throws {AppException} 이메일 또는 비밀번호 불일치 시
   */
  async execute(props: LoginUseCaseProps): Promise<LoginResponseDataDto> {
    const { email, password } = props.bodyDto;

    const user = await this.findUser(email);

    await this.verifyPassword(password, user.password);

    const tokenData = this.issueToken(user);

    return this.buildResponseDto(tokenData);
  }

  /**
   * 이메일로 사용자 조회
   *
   * @param {string} email 이메일
   * @returns {Promise<{ id: number; email: string; password: string }>} 사용자 정보
   * @throws {AppException} 사용자가 없는 경우
   */
  private async findUser(email: string): Promise<{ id: number; email: string; password: string }> {
    const user = await this.queryBus.execute(new GetUserByEmailQuery({ email }));

    if (!isDefined(user)) {
      throw new AppException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    return user;
  }

  /**
   * 비밀번호 검증
   *
   * @param {string} password 입력된 평문 비밀번호
   * @param {string} hashedPassword 저장된 해시 비밀번호
   * @throws {AppException} 비밀번호 불일치 시
   */
  private async verifyPassword(password: string, hashedPassword: string): Promise<void> {
    const isMatch = await bcrypt.compare(password, hashedPassword);

    if (!isMatch) {
      throw new AppException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }
  }

  /**
   * JWT 토큰 발급
   *
   * @param {{ id: number; email: string }} user 사용자 정보
   * @returns {{ accessToken: string; expiresIn: string }} 발급된 토큰 및 만료 정보
   */
  private issueToken(user: { id: number; email: string }): { accessToken: string; expiresIn: string } {
    const expiresIn = this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN');

    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email }, { expiresIn: expiresIn as any });

    return { accessToken, expiresIn };
  }

  /**
   * 응답 DTO 생성
   *
   * @param {{ accessToken: string; expiresIn: string }} tokenData 토큰 데이터
   * @returns {LoginResponseDataDto} 응답 DTO
   */
  private buildResponseDto(tokenData: { accessToken: string; expiresIn: string }): LoginResponseDataDto {
    return LoginResponseDataDto.from(tokenData);
  }
}

interface LoginUseCaseProps {
  bodyDto: LoginRequestBodyDto;
}
