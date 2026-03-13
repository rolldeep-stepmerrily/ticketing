import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenRequestBodyDto {
  @ApiProperty({ description: '리프레시 토큰' })
  @IsString()
  readonly refreshToken!: string;
}

export class RefreshTokenResponseDataDto {
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
   * @param {RefreshTokenResponseDataDto} data 토큰 데이터
   * @returns {RefreshTokenResponseDataDto} 응답 DTO
   */
  static from(data: RefreshTokenResponseDataDto): RefreshTokenResponseDataDto {
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessExpiresIn: data.accessExpiresIn,
      refreshExpiresIn: data.refreshExpiresIn,
    };
  }
}
