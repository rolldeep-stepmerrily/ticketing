import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class HandleBookingCancelledUseCase {
  private readonly logger = new Logger(HandleBookingCancelledUseCase.name);

  /**
   * 예매 취소 이벤트 처리 (알림/환불 등 후속 처리 확장 포인트)
   *
   * @param {HandleBookingCancelledUseCaseProps} props 취소 이벤트 데이터
   */
  execute(props: HandleBookingCancelledUseCaseProps): void {
    this.logger.log(`Booking cancelled: ticketId=${props.ticketId}, userId=${props.userId}, seatId=${props.seatId}`);
  }
}

interface HandleBookingCancelledUseCaseProps {
  ticketId: number;
  userId: number;
  seatId: number;
  concertId: number;
}
