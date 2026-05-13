import { PrismaService } from '@@db';
import { SeatGrade } from '@@prisma';
import { RedisService } from '@@redis';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

const SEAT_STOCK_KEY_PREFIX = 'ticketing:seat:';
const CONCERT_CREATE_TX_TIMEOUT_MS = 30_000;

interface ConcertSeatInput {
  row: string;
  number: number;
  grade: SeatGrade;
  price: number;
}

interface CreateConcertResult {
  id: number;
  title: string;
  venue: string;
  startsAt: Date;
  endsAt: Date;
  seats: Array<{ id: number }>;
}

export class CreateConcertCommand extends Command<CreateConcertResult> {
  constructor(public readonly props: CreateConcertCommandProps) {
    super();
  }
}

@CommandHandler(CreateConcertCommand)
export class CreateConcertCommandHandler implements ICommandHandler<CreateConcertCommand, CreateConcertResult> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 공연 및 좌석 생성 + Redis 재고 초기화 (단일 트랜잭션)
   *
   * Redis 초기화가 실패하면 트랜잭션이 롤백되어 DB와 Redis 간 불일치를 방지합니다.
   *
   * @param {CreateConcertCommand} command 생성 커맨드
   * @returns {Promise<CreateConcertResult>} 생성된 공연 및 좌석 정보
   */
  async execute(command: CreateConcertCommand): Promise<CreateConcertResult> {
    const { title, venue, startsAt, endsAt, description, seats } = command.props;

    return await this.prisma.$transaction(
      async (tx) => {
        const concert = await tx.concert.create({
          data: { title, venue, startsAt: new Date(startsAt), endsAt: new Date(endsAt), description },
          select: { id: true, title: true, venue: true, startsAt: true, endsAt: true },
        });

        await tx.seat.createMany({
          data: seats.map((seat) => ({
            concertId: concert.id,
            row: seat.row,
            number: seat.number,
            grade: seat.grade,
            price: seat.price,
          })),
        });

        const createdSeats = await tx.seat.findMany({
          where: { concertId: concert.id },
          select: { id: true },
        });

        await this.redisService.setStocksAtomic(
          createdSeats.map((seat) => ({ key: `${SEAT_STOCK_KEY_PREFIX}${seat.id}:stock`, stock: 1 })),
        );

        return { ...concert, seats: createdSeats };
      },
      { timeout: CONCERT_CREATE_TX_TIMEOUT_MS },
    );
  }
}

interface CreateConcertCommandProps {
  title: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  description?: string;
  seats: ConcertSeatInput[];
}
