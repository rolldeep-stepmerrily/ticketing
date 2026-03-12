import { TypedCommandBus, TypedQueryBus } from '@@cqrs';
import { AppException } from '@@exceptions';
import { SeatStatus } from '@@prisma';
import { RedisService } from '@@redis';
import { Test, TestingModule } from '@nestjs/testing';
import { BOOKING_ERRORS } from '../../booking.error';
import { CreateTicketCommand } from '../commands/create-ticket.command';
import { GetSeatQuery } from '../queries/get-seat.query';
import { CreateBookingUseCase } from './create-booking.use-case';

const SEAT_ID = 1;
const USER_ID = 10;
const CONCERT_ID = 100;
const TICKET_ID = 999;

const mockSeat = { id: SEAT_ID, concertId: CONCERT_ID, status: SeatStatus.AVAILABLE };
const mockTicket = { id: TICKET_ID, seatId: SEAT_ID, status: 'PENDING', createdAt: new Date() };

const executeProps = { userId: USER_ID, seatId: SEAT_ID };

describe('CreateBookingUseCase', () => {
  let useCase: CreateBookingUseCase;
  let queryBus: jest.Mocked<TypedQueryBus<GetSeatQuery>>;
  let commandBus: jest.Mocked<TypedCommandBus<CreateTicketCommand>>;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBookingUseCase,
        {
          provide: TypedQueryBus,
          useValue: { execute: jest.fn() },
        },
        {
          provide: TypedCommandBus,
          useValue: { execute: jest.fn() },
        },
        {
          provide: RedisService,
          useValue: {
            acquireLock: jest.fn(),
            releaseLock: jest.fn(),
            decrementStock: jest.fn(),
            incrementStock: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(CreateBookingUseCase);
    queryBus = module.get(TypedQueryBus);
    commandBus = module.get(TypedCommandBus);
    redisService = module.get(RedisService);
  });

  describe('execute', () => {
    it('정상 예매 — 티켓을 생성하고 응답 DTO를 반환한다', async () => {
      queryBus.execute.mockResolvedValue(mockSeat);
      redisService.acquireLock.mockResolvedValue(true);
      redisService.decrementStock.mockResolvedValue(1);
      commandBus.execute.mockResolvedValue(mockTicket);
      redisService.releaseLock.mockResolvedValue(true);

      const result = await useCase.execute(executeProps);

      expect(result.id).toBe(TICKET_ID);
      expect(result.seatId).toBe(SEAT_ID);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ props: { userId: USER_ID, seatId: SEAT_ID, concertId: CONCERT_ID } }),
      );
    });

    it('좌석이 없으면 SEAT_NOT_FOUND 예외를 던진다', async () => {
      queryBus.execute.mockResolvedValue(null);

      await expect(useCase.execute(executeProps)).rejects.toThrow(AppException);

      await expect(useCase.execute(executeProps)).rejects.toMatchObject({
        response: expect.objectContaining({ errorCode: BOOKING_ERRORS.SEAT_NOT_FOUND.errorCode }),
      });
    });

    it('좌석이 AVAILABLE이 아니면 SEAT_NOT_AVAILABLE 예외를 던진다', async () => {
      queryBus.execute.mockResolvedValue({ ...mockSeat, status: SeatStatus.RESERVED });

      await expect(useCase.execute(executeProps)).rejects.toMatchObject({
        response: expect.objectContaining({ errorCode: BOOKING_ERRORS.SEAT_NOT_AVAILABLE.errorCode }),
      });
    });

    it('분산 락 획득 실패 시 BOOKING_IN_PROGRESS 예외를 던진다', async () => {
      queryBus.execute.mockResolvedValue(mockSeat);
      redisService.acquireLock.mockResolvedValue(false);

      await expect(useCase.execute(executeProps)).rejects.toMatchObject({
        response: expect.objectContaining({ errorCode: BOOKING_ERRORS.BOOKING_IN_PROGRESS.errorCode }),
      });
    });

    it('재고가 0이면 SEAT_NOT_AVAILABLE 예외를 던진다', async () => {
      queryBus.execute.mockResolvedValue(mockSeat);
      redisService.acquireLock.mockResolvedValue(true);
      redisService.decrementStock.mockResolvedValue(0);
      redisService.releaseLock.mockResolvedValue(true);

      await expect(useCase.execute(executeProps)).rejects.toMatchObject({
        response: expect.objectContaining({ errorCode: BOOKING_ERRORS.SEAT_NOT_AVAILABLE.errorCode }),
      });
    });

    it('락 획득 후 좌석 상태가 변경된 경우 SEAT_NOT_AVAILABLE을 던진다 (double-check)', async () => {
      queryBus.execute
        .mockResolvedValueOnce(mockSeat)
        .mockResolvedValueOnce({ ...mockSeat, status: SeatStatus.RESERVED });
      redisService.acquireLock.mockResolvedValue(true);
      redisService.releaseLock.mockResolvedValue(true);

      await expect(useCase.execute(executeProps)).rejects.toMatchObject({
        response: expect.objectContaining({ errorCode: BOOKING_ERRORS.SEAT_NOT_AVAILABLE.errorCode }),
      });
    });

    it('티켓 생성 실패 시 Redis 재고를 복구한다 (보상 트랜잭션)', async () => {
      queryBus.execute.mockResolvedValue(mockSeat);
      redisService.acquireLock.mockResolvedValue(true);
      redisService.decrementStock.mockResolvedValue(1);
      commandBus.execute.mockRejectedValue(new Error('DB error'));
      redisService.releaseLock.mockResolvedValue(true);

      await expect(useCase.execute(executeProps)).rejects.toThrow('DB error');

      expect(redisService.incrementStock).toHaveBeenCalledWith(`ticketing:seat:${SEAT_ID}:stock`);
    });

    it('분산 락은 성공/실패와 무관하게 항상 해제된다 (finally)', async () => {
      queryBus.execute.mockResolvedValue(mockSeat);
      redisService.acquireLock.mockResolvedValue(true);
      redisService.decrementStock.mockResolvedValue(0);
      redisService.releaseLock.mockResolvedValue(true);

      await expect(useCase.execute(executeProps)).rejects.toThrow();

      expect(redisService.releaseLock).toHaveBeenCalled();
    });
  });
});
