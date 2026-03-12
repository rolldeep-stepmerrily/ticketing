import { TicketStatus } from '@@prisma';
import { Test, TestingModule } from '@nestjs/testing';
import { TypedCommandBus } from 'src/common/cqrs';
import { PrismaService } from 'src/common/prisma';
import { RedisService } from 'src/common/redis';
import { BOOKING_ERRORS } from '../../booking.error';
import { CancelTicketCommand } from '../commands/cancel-ticket.command';
import { CancelBookingUseCase } from './cancel-booking.use-case';

const TICKET_ID = 1;
const USER_ID = 10;
const SEAT_ID = 50;
const CONCERT_ID = 100;

const mockTicket = {
  id: TICKET_ID,
  userId: USER_ID,
  seatId: SEAT_ID,
  status: TicketStatus.CONFIRMED,
  seat: { concertId: CONCERT_ID },
};

describe('CancelBookingUseCase', () => {
  let useCase: CancelBookingUseCase;
  let commandBus: jest.Mocked<TypedCommandBus<CancelTicketCommand>>;
  let prismaService: { ticket: { findFirst: jest.Mock } };
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelBookingUseCase,
        {
          provide: TypedCommandBus,
          useValue: { execute: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: { ticket: { findFirst: jest.fn() } },
        },
        {
          provide: RedisService,
          useValue: { incrementStock: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(CancelBookingUseCase);
    commandBus = module.get(TypedCommandBus);
    prismaService = module.get(PrismaService);
    redisService = module.get(RedisService);
  });

  describe('execute', () => {
    it('정상 취소 — 티켓을 취소하고 Redis 재고를 복구한다', async () => {
      prismaService.ticket.findFirst.mockResolvedValue(mockTicket);
      commandBus.execute.mockResolvedValue(undefined);
      redisService.incrementStock.mockResolvedValue(1);

      await useCase.execute({ userId: USER_ID, ticketId: TICKET_ID });

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          props: { ticketId: TICKET_ID, seatId: SEAT_ID, userId: USER_ID, concertId: CONCERT_ID },
        }),
      );
      expect(redisService.incrementStock).toHaveBeenCalledWith(`ticketing:seat:${SEAT_ID}:stock`);
    });

    it('PENDING 상태 티켓도 취소할 수 있다', async () => {
      prismaService.ticket.findFirst.mockResolvedValue({ ...mockTicket, status: TicketStatus.PENDING });
      commandBus.execute.mockResolvedValue(undefined);

      await expect(useCase.execute({ userId: USER_ID, ticketId: TICKET_ID })).resolves.not.toThrow();
    });

    it('티켓을 찾을 수 없으면 TICKET_NOT_FOUND 예외를 던진다', async () => {
      prismaService.ticket.findFirst.mockResolvedValue(null);

      await expect(useCase.execute({ userId: USER_ID, ticketId: TICKET_ID })).rejects.toMatchObject({
        response: expect.objectContaining({ errorCode: BOOKING_ERRORS.TICKET_NOT_FOUND.errorCode }),
      });
    });

    it('다른 사용자의 티켓은 찾을 수 없다 (소유자 불일치)', async () => {
      prismaService.ticket.findFirst.mockResolvedValue(null);

      await expect(useCase.execute({ userId: 999, ticketId: TICKET_ID })).rejects.toMatchObject({
        response: expect.objectContaining({ errorCode: BOOKING_ERRORS.TICKET_NOT_FOUND.errorCode }),
      });
    });

    it('CANCELLED 상태 티켓은 TICKET_NOT_CANCELLABLE 예외를 던진다', async () => {
      prismaService.ticket.findFirst.mockResolvedValue({ ...mockTicket, status: TicketStatus.CANCELLED });

      await expect(useCase.execute({ userId: USER_ID, ticketId: TICKET_ID })).rejects.toMatchObject({
        response: expect.objectContaining({ errorCode: BOOKING_ERRORS.TICKET_NOT_CANCELLABLE.errorCode }),
      });
    });

    it('CancelTicketCommand에 올바른 props를 전달한다 (Outbox 이벤트 포함)', async () => {
      prismaService.ticket.findFirst.mockResolvedValue(mockTicket);
      commandBus.execute.mockResolvedValue(undefined);

      await useCase.execute({ userId: USER_ID, ticketId: TICKET_ID });

      const [calledCommand] = commandBus.execute.mock.calls[0] as [CancelTicketCommand];
      expect(calledCommand).toBeInstanceOf(CancelTicketCommand);
      expect(calledCommand.props).toEqual({ ticketId: TICKET_ID, seatId: SEAT_ID, userId: USER_ID, concertId: CONCERT_ID });
    });
  });
});
