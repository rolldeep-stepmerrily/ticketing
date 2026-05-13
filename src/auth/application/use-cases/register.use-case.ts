import { TypedCommandBus, TypedQueryBus } from '@@cqrs';
import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { isDefined } from 'class-validator';
import { AUTH_ERRORS } from '../../auth.error';
import { RegisterRequestBodyDto, RegisterResponseDataDto } from '../../presenter/http/dto/register.dto';
import { CreateUserCommand } from '../commands/create-user.command';
import { GetUserByEmailQuery } from '../queries/get-user-by-email.query';

const PRISMA_UNIQUE_VIOLATION_CODE = 'P2002';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly commandBus: TypedCommandBus<CreateUserCommand>,
    private readonly queryBus: TypedQueryBus<GetUserByEmailQuery>,
  ) {}

  /**
   * 회원가입 실행
   *
   * @param {RegisterUseCaseProps} props 회원가입 요청 데이터
   * @returns {Promise<RegisterResponseDataDto>} 생성된 사용자 정보
   * @throws {AppException} 이메일 중복 시
   */
  async execute(props: RegisterUseCaseProps): Promise<RegisterResponseDataDto> {
    const { email, password, name } = props.bodyDto;

    await this.checkEmailDuplication(email);

    const hashedPassword = await this.hashPassword(password);

    const user = await this.createUser({ email, hashedPassword, name });

    return this.buildResponseDto(user);
  }

  /**
   * 이메일 중복 확인
   *
   * @param {string} email 확인할 이메일
   * @throws {AppException} 이미 사용 중인 이메일인 경우
   */
  private async checkEmailDuplication(email: string): Promise<void> {
    const existing = await this.queryBus.execute(new GetUserByEmailQuery({ email }));

    if (isDefined(existing)) {
      throw new AppException(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
    }
  }

  /**
   * 비밀번호 해시
   *
   * @param {string} password 평문 비밀번호
   * @returns {Promise<string>} 해시된 비밀번호
   */
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  /**
   * 사용자 생성
   *
   * @param {{ email: string; hashedPassword: string; name: string }} props 생성 데이터
   * @returns {Promise<{ id: number; email: string; name: string }>} 생성된 사용자
   */
  private async createUser(props: {
    email: string;
    hashedPassword: string;
    name: string;
  }): Promise<{ id: number; email: string; name: string }> {
    try {
      return await this.commandBus.execute(
        new CreateUserCommand({ email: props.email, password: props.hashedPassword, name: props.name }),
      );
    } catch (error) {
      // checkEmailDuplication과 createUser 사이 race condition으로 동일 이메일이 동시에 INSERT 되는 경우
      // Prisma가 P2002(unique violation) 에러를 던집니다. AUTH 표준 에러로 변환합니다.
      if (this.isUniqueConstraintViolation(error)) {
        throw new AppException(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
      }
      throw error;
    }
  }

  /**
   * Prisma unique constraint(P2002) 에러 여부 판별
   *
   * @param {unknown} error 검사할 에러
   * @returns {boolean} P2002 에러 여부
   */
  private isUniqueConstraintViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: unknown }).code === PRISMA_UNIQUE_VIOLATION_CODE
    );
  }

  /**
   * 응답 DTO 생성
   *
   * @param {{ id: number; email: string; name: string }} user 사용자 데이터
   * @returns {RegisterResponseDataDto} 응답 DTO
   */
  private buildResponseDto(user: { id: number; email: string; name: string }): RegisterResponseDataDto {
    return RegisterResponseDataDto.from(user);
  }
}

interface RegisterUseCaseProps {
  bodyDto: RegisterRequestBodyDto;
}
