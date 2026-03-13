import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginRequestBodyDto {
  @ApiProperty({ example: 'user@example.com', type: String })
  @IsEmail()
  readonly email!: string;

  @ApiProperty({ example: 'password123', type: String })
  @IsString()
  readonly password!: string;
}

export class LoginResponseDataDto {
  @ApiProperty()
  readonly accessToken!: string;

  @ApiProperty()
  readonly refreshToken!: string;

  @ApiProperty()
  readonly accessExpiresIn!: string;

  @ApiProperty()
  readonly refreshExpiresIn!: string;

  /**
   * 토큰 데이터로부터 응답 DTO 생성
   *
   * @param {LoginResponseDataDto} data 토큰 데이터
   * @returns {LoginResponseDataDto} 응답 DTO
   */
  static from(data: LoginResponseDataDto): LoginResponseDataDto {
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessExpiresIn: data.accessExpiresIn,
      refreshExpiresIn: data.refreshExpiresIn,
    };
  }
}
