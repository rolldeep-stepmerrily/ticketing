import { TypedCommandBus } from '@@cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfirmTicketCommand } from '../commands/confirm-ticket.command';

@Injectable()
export class ConfirmBookingUseCase {
  private readonly logger = new Logger(ConfirmBookingUseCase.name);

  constructor(private readonly commandBus: TypedCommandBus<ConfirmTicketCommand>) {}

  /**
   * 예매 확정 실행 — PENDING 상태의 티켓을 CONFIRMED로 변경
   *
   * @param {ConfirmBookingUseCaseProps} props 확정 요청 데이터
   */
  async execute(props: ConfirmBookingUseCaseProps): Promise<void> {
    await this.confirmTicket(props.ticketId);

    this.logger.log(`Booking confirmed: ticketId=${props.ticketId}`);
  }

  /**
   * 티켓 상태를 CONFIRMED로 변경
   *
   * @param {number} ticketId 티켓 ID
   */
  private async confirmTicket(ticketId: number): Promise<void> {
    await this.commandBus.execute(new ConfirmTicketCommand({ ticketId }));
  }
}

interface ConfirmBookingUseCaseProps {
  ticketId: number;
}
