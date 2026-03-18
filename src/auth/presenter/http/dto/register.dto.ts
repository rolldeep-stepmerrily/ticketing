import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class RegisterRequestBodyDto {
  @ApiProperty({ example: 'user@example.com', type: String })
  @IsEmail()
  readonly email!: string;

  @ApiProperty({ example: 'password123', minLength: 8, maxLength: 20, type: String })
  @IsString()
  @Length(8, 20)
  readonly password!: string;

  @ApiProperty({ example: '홍길동', type: String })
  @IsString()
  @Length(1, 20)
  readonly name!: string;
}

export class RegisterResponseDataDto {
  @ApiProperty({ type: Number, description: '사용자 ID' })
  readonly id!: number;

  @ApiProperty({ type: String, description: '이메일' })
  readonly email!: string;

  @ApiProperty({ type: String, description: '이름' })
  readonly name!: string;

  /**
   * 엔티티로부터 응답 DTO 생성
   *
   * @param {RegisterResponseDataDto} data 사용자 데이터
   * @returns {RegisterResponseDataDto} 응답 DTO
   */
  static from(data: RegisterResponseDataDto): RegisterResponseDataDto {
    return { id: data.id, email: data.email, name: data.name };
  }
}
