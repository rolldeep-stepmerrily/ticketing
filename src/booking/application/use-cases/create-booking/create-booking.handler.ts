import { AppException } from '@@exceptions';
import { SeatStatus, TicketStatus } from '@@prisma';
import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { KafkaProducerService } from 'src/common/kafka';
import { PrismaService } from 'src/common/prisma';
import { RedisService } from 'src/common/redis';
import { BOOKING_ERRORS } from '../../../booking.error';
import { CreateBookingCommand, CreateBookingResult } from './create-booking.command';

const LOCK_TTL_SECONDS = 10;
const SEAT_STOCK_PREFIX = 'ticketing:seat:';
const LOCK_PREFIX = 'ticketing:lock:seat:';
const TOPIC_BOOKING_CREATED = 'ticketing.booking.created';

@CommandHandler(CreateBookingCommand)
export class CreateBookingHandler implements ICommandHandler<CreateBookingCommand, CreateBookingResult> {
  private readonly logger = new Logger(CreateBookingHandler.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {}

  async execute(command: CreateBookingCommand): Promise<CreateBookingResult> {
    const { userId, seatId } = command;

    // 1. 좌석 존재 및 상태 확인
    const seat = await this.prismaService.seat.findFirst({ where: { id: seatId } });
    if (!seat) throw new AppException(BOOKING_ERRORS.SEAT_NOT_FOUND);
    if (seat.status !== SeatStatus.AVAILABLE) throw new AppException(BOOKING_ERRORS.SEAT_NOT_AVAILABLE);

    // 2. 분산 락 획득 (SET NX EX)
    const lockKey = `${LOCK_PREFIX}${seatId}`;
    const lockValue = `user:${userId}:${Date.now()}`;
    const acquired = await this.redisService.acquireLock(lockKey, lockValue, LOCK_TTL_SECONDS);
    if (!acquired) throw new AppException(BOOKING_ERRORS.BOOKING_IN_PROGRESS);

    const stockKey = `${SEAT_STOCK_PREFIX}${seatId}:stock`;

    try {
      // 3. 락 하에서 DB 재확인 (double-check)
      const seatUnderLock = await this.prismaService.seat.findFirst({ where: { id: seatId } });
      if (!seatUnderLock || seatUnderLock.status !== SeatStatus.AVAILABLE) {
        throw new AppException(BOOKING_ERRORS.SEAT_NOT_AVAILABLE);
      }

      // 4. Redis Lua script: 원자적 재고 감소
      const stockResult = await this.redisService.decrementStock(stockKey, 1);
      if (stockResult === 0) throw new AppException(BOOKING_ERRORS.SEAT_NOT_AVAILABLE);

      // 5. DB 트랜잭션: 좌석 상태 변경 + 티켓 생성
      let ticketId: number;
      let createdAt: Date;

      try {
        const ticket = await this.prismaService.$transaction(async (tx) => {
          await tx.seat.update({
            where: { id: seatId, status: SeatStatus.AVAILABLE },
            data: { status: SeatStatus.RESERVED },
          });

          return tx.ticket.create({
            data: { userId, seatId, status: TicketStatus.PENDING },
            select: { id: true, seatId: true, status: true, createdAt: true },
          });
        });

        ticketId = ticket.id;
        createdAt = ticket.createdAt;
      } catch (error) {
        // DB 실패 시 Redis 재고 보상
        await this.redisService.incrementStock(stockKey);
        throw error;
      }

      // 6. Kafka 이벤트 발행: ticketing.booking.created
      await this.kafkaProducerService.sendMessage(
        TOPIC_BOOKING_CREATED,
        { ticketId, userId, seatId, concertId: seatUnderLock.concertId },
        String(seatId),
      );

      this.logger.log(`Booking created: ticketId=${ticketId}, userId=${userId}, seatId=${seatId}`);

      return { id: ticketId, seatId, status: TicketStatus.PENDING, createdAt };
    } finally {
      // 락 해제 (Lua script로 소유자 검증 후 삭제)
      await this.redisService.releaseLock(lockKey, lockValue);
    }
  }
}
