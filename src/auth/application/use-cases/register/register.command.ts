import { Command } from '@nestjs/cqrs';
import { CommandProps } from 'src/common/cqrs/command-props';

export interface RegisterResult {
  id: number;
  email: string;
  name: string;
}

export class RegisterCommand extends Command<RegisterResult> {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
  ) {
    super();
  }
}

export type RegisterCommandProps = CommandProps<RegisterCommand>;
