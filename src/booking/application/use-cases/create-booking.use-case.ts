import { AppException } from '@@exceptions';
import { SeatStatus } from '@@prisma';
import { Injectable, Logger } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { TypedCommandBus, TypedQueryBus } from '@@cqrs';
import { RedisService } from '@@redis';
import { BOOKING_ERRORS } from '../../booking.error';
import { CreateBookingResponseDataDto } from '../../presenter/http/dto/create-booking.dto';
import { CreateTicketCommand } from '../commands/create-ticket.command';
import { GetSeatQuery } from '../queries/get-seat.query';

const LOCK_TTL_SECONDS = 10;
const SEAT_STOCK_KEY_PREFIX = 'ticketing:seat:';
const LOCK_KEY_PREFIX = 'ticketing:lock:seat:';

@Injectable()
export class CreateBookingUseCase {
  private readonly logger = new Logger(CreateBookingUseCase.name);

  constructor(
    private readonly commandBus: TypedCommandBus<CreateTicketCommand>,
    private readonly queryBus: TypedQueryBus<GetSeatQuery>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 티켓 예매 실행
   *
   * @param {CreateBookingUseCaseProps} props 예매 요청 데이터
   * @returns {Promise<CreateBookingResponseDataDto>} 생성된 티켓 정보
   * @throws {AppException} 좌석 없음, 좌석 이미 예약됨, 예매 진행 중인 경우
   */
  async execute(props: CreateBookingUseCaseProps): Promise<CreateBookingResponseDataDto> {
    const { userId, seatId } = props;

    const seat = await this.validateSeat(seatId);

    const lockKey = `${LOCK_KEY_PREFIX}${seatId}`;
    const lockValue = `user:${userId}:${Date.now()}`;

    await this.acquireBookingLock(lockKey, lockValue);

    const stockKey = `${SEAT_STOCK_KEY_PREFIX}${seatId}:stock`;

    try {
      await this.validateSeatUnderLock(seatId);

      await this.decrementSeatStock(stockKey);

      const ticket = await this.createTicket({ userId, seatId, concertId: seat.concertId, stockKey });

      this.logger.log(`Booking created: ticketId=${ticket.id}, userId=${userId}, seatId=${seatId}`);

      return this.buildResponseDto(ticket);
    } finally {
      await this.redisService.releaseLock(lockKey, lockValue);
    }
  }

  /**
   * 좌석 존재 및 예약 가능 여부 확인
   *
   * @param {number} seatId 좌석 ID
   * @returns {Promise<SeatData>} 좌석 정보
   * @throws {AppException} 좌석이 없거나 예약 불가한 경우
   */
  private async validateSeat(seatId: number): Promise<SeatData> {
    const seat = await this.queryBus.execute(new GetSeatQuery({ seatId }));

    if (!isDefined(seat)) {
      throw new AppException(BOOKING_ERRORS.SEAT_NOT_FOUND);
    }

    if (seat.status !== SeatStatus.AVAILABLE) {
      throw new AppException(BOOKING_ERRORS.SEAT_NOT_AVAILABLE);
    }

    return seat;
  }

  /**
   * 분산 락 획득 (SET NX EX)
   *
   * @param {string} lockKey 락 키
   * @param {string} lockValue 락 값 (소유자 식별)
   * @throws {AppException} 락 획득 실패 시
   */
  private async acquireBookingLock(lockKey: string, lockValue: string): Promise<void> {
    const acquired = await this.redisService.acquireLock(lockKey, lockValue, LOCK_TTL_SECONDS);

    if (!acquired) {
      throw new AppException(BOOKING_ERRORS.BOOKING_IN_PROGRESS);
    }
  }

  /**
   * 분산 락 획득 후 좌석 상태 재확인 (double-check)
   *
   * @param {number} seatId 좌석 ID
   * @throws {AppException} 좌석이 이미 예약된 경우
   */
  private async validateSeatUnderLock(seatId: number): Promise<void> {
    const seat = await this.queryBus.execute(new GetSeatQuery({ seatId }));

    if (!isDefined(seat) || seat.status !== SeatStatus.AVAILABLE) {
      throw new AppException(BOOKING_ERRORS.SEAT_NOT_AVAILABLE);
    }
  }

  /**
   * Redis Lua script로 좌석 재고 원자적 감소
   *
   * @param {string} stockKey 재고 키
   * @throws {AppException} 재고가 없는 경우
   */
  private async decrementSeatStock(stockKey: string): Promise<void> {
    const result = await this.redisService.decrementStock(stockKey, 1);

    if (result === 0) {
      throw new AppException(BOOKING_ERRORS.SEAT_NOT_AVAILABLE);
    }
  }

  /**
   * DB 트랜잭션으로 티켓 생성 및 Outbox 이벤트 기록 (실패 시 Redis 재고 보상)
   *
   * @param {{ userId: number; seatId: number; concertId: number; stockKey: string }} props 생성 데이터
   * @returns {Promise<TicketData>} 생성된 티켓
   */
  private async createTicket(props: {
    userId: number;
    seatId: number;
    concertId: number;
    stockKey: string;
  }): Promise<TicketData> {
    try {
      return await this.commandBus.execute(
        new CreateTicketCommand({ userId: props.userId, seatId: props.seatId, concertId: props.concertId }),
      );
    } catch (error) {
      await this.redisService.incrementStock(props.stockKey);

      throw error;
    }
  }

  /**
   * 응답 DTO 생성
   *
   * @param {TicketData} ticket 티켓 데이터
   * @returns {CreateBookingResponseDataDto} 응답 DTO
   */
  private buildResponseDto(ticket: TicketData): CreateBookingResponseDataDto {
    return CreateBookingResponseDataDto.from(ticket);
  }
}

interface CreateBookingUseCaseProps {
  userId: number;
  seatId: number;
}

interface SeatData {
  id: number;
  concertId: number;
  status: string;
}

interface TicketData {
  id: number;
  seatId: number;
  status: string;
  createdAt: Date;
}
