import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  readonly email!: string;

  @ApiProperty({ example: 'password123', minLength: 8, maxLength: 20 })
  @IsString()
  @Length(8, 20)
  readonly password!: string;

  @ApiProperty({ example: '홍길동' })
  @IsString()
  @Length(1, 20)
  readonly name!: string;
}
