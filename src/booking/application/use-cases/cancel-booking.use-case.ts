import { TypedCommandBus, TypedQueryBus } from '@@cqrs';
import { AppException } from '@@exceptions';
import { TicketStatus } from '@@prisma';
import { Injectable, Logger } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { BOOKING_ERRORS } from '../../booking.error';
import { CancelTicketCommand } from '../commands/cancel-ticket.command';
import { GetTicketQuery } from '../queries/get-ticket.query';

@Injectable()
export class CancelBookingUseCase {
  private readonly logger = new Logger(CancelBookingUseCase.name);

  constructor(
    private readonly commandBus: TypedCommandBus<CancelTicketCommand>,
    private readonly queryBus: TypedQueryBus<GetTicketQuery>,
  ) {}

  /**
   * 예매 취소 실행
   *
   * @param {CancelBookingUseCaseProps} props 취소 요청 데이터
   * @throws {AppException} 티켓 없음 또는 취소 불가 상태인 경우
   */
  async execute(props: CancelBookingUseCaseProps): Promise<void> {
    const { userId, ticketId } = props;

    const ticket = await this.findTicket({ userId, ticketId });

    this.validateCancellable(ticket);

    await this.commandBus.execute(
      new CancelTicketCommand({ ticketId, seatId: ticket.seatId, userId, concertId: ticket.seat.concertId }),
    );

    this.logger.log(`Booking cancelled: ticketId=${ticketId}, userId=${userId}`);
  }

  /**
   * 티켓 조회 (소유자 확인 포함)
   *
   * @param {{ userId: number; ticketId: number }} params 조회 파라미터
   * @returns {Promise<TicketWithSeat>} 티켓 정보
   * @throws {AppException} 티켓이 없거나 소유자가 다른 경우
   */
  private async findTicket(params: { userId: number; ticketId: number }): Promise<TicketWithSeat> {
    const ticket = await this.queryBus.execute(
      new GetTicketQuery({ ticketId: params.ticketId, userId: params.userId }),
    );

    if (!isDefined(ticket)) {
      throw new AppException(BOOKING_ERRORS.TICKET_NOT_FOUND);
    }

    return ticket;
  }

  /**
   * 티켓 취소 가능 여부 검증
   *
   * @param {TicketWithSeat} ticket 티켓 정보
   * @throws {AppException} 취소 불가 상태인 경우
   */
  private validateCancellable(ticket: TicketWithSeat): void {
    const isCancellable = ticket.status === TicketStatus.PENDING || ticket.status === TicketStatus.CONFIRMED;

    if (!isCancellable) {
      throw new AppException(BOOKING_ERRORS.TICKET_NOT_CANCELLABLE);
    }
  }
}

interface CancelBookingUseCaseProps {
  userId: number;
  ticketId: number;
}

interface TicketWithSeat {
  id: number;
  userId: number;
  seatId: number;
  status: string;
  seat: { concertId: number };
}
