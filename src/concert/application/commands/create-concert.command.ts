import { PrismaService } from '@@db';
import { SeatGrade } from '@@prisma';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 공연 및 좌석 생성 (트랜잭션)
   *
   * @param {CreateConcertCommand} command 생성 커맨드
   * @returns {Promise<CreateConcertResult>} 생성된 공연 및 좌석 정보
   */
  async execute(command: CreateConcertCommand): Promise<CreateConcertResult> {
    const { title, venue, startsAt, endsAt, description, seats } = command.props;

    return await this.prisma.$transaction(async (tx) => {
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

      return { ...concert, seats: createdSeats };
    });
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
