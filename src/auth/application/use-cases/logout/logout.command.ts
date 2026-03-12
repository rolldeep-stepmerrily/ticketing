import { Command } from '@nestjs/cqrs';
import { CommandProps } from 'src/common/cqrs/command-props';

export class LogoutCommand extends Command<void> {
  constructor(public readonly token: string) {
    super();
  }
}

export type LogoutCommandProps = CommandProps<LogoutCommand>;
