import { Command } from '@nestjs/cqrs';
import { CommandProps } from 'src/common/cqrs/command-props';

export interface CreateBookingResult {
  id: number;
  seatId: number;
  status: string;
  createdAt: Date;
}

export class CreateBookingCommand extends Command<CreateBookingResult> {
  constructor(
    public readonly userId: number,
    public readonly seatId: number,
  ) {
    super();
  }
}

export type CreateBookingCommandProps = CommandProps<CreateBookingCommand>;
