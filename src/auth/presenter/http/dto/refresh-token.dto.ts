import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenRequestBodyDto {
  @ApiProperty({ type: String, description: '리프레시 토큰' })
  @IsString()
  readonly refreshToken!: string;
}

export class RefreshTokenResponseDataDto {
  @ApiProperty({ type: String, description: '액세스 토큰' })
  readonly accessToken!: string;

  @ApiProperty({ type: String, description: '리프레시 토큰' })
  readonly refreshToken!: string;

  @ApiProperty({ type: String, description: '액세스 토큰 만료 시간' })
  readonly accessExpiresIn!: string;

  @ApiProperty({ type: String, description: '리프레시 토큰 만료 시간' })
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
