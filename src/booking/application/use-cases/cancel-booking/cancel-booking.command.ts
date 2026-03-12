import { Command } from '@nestjs/cqrs';
import { CommandProps } from 'src/common/cqrs/command-props';

export class CancelBookingCommand extends Command<void> {
  constructor(
    public readonly userId: number,
    public readonly ticketId: number,
  ) {
    super();
  }
}

export type CancelBookingCommandProps = CommandProps<CancelBookingCommand>;
