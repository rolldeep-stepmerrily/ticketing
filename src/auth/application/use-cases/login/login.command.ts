import { Command } from '@nestjs/cqrs';
import { CommandProps } from 'src/common/cqrs/command-props';

export interface LoginResult {
  accessToken: string;
  expiresIn: string;
}

export class LoginCommand extends Command<LoginResult> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}

export type LoginCommandProps = CommandProps<LoginCommand>;
