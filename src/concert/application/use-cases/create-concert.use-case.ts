import { TypedCommandBus } from '@@cqrs';
import { RedisService } from '@@redis';
import { Injectable, Logger } from '@nestjs/common';
import { CreateConcertRequestBodyDto, CreateConcertResponseDataDto } from '../../presenter/http/dto/create-concert.dto';
import { CreateConcertCommand } from '../commands/create-concert.command';

const SEAT_STOCK_KEY_PREFIX = 'ticketing:seat:';

@Injectable()
export class CreateConcertUseCase {
  private readonly logger = new Logger(CreateConcertUseCase.name);

  constructor(
    private readonly commandBus: TypedCommandBus<CreateConcertCommand>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 공연 생성 및 좌석 Redis 재고 초기화
   *
   * @param {CreateConcertUseCaseProps} props 공연 생성 요청 데이터
   * @returns {Promise<CreateConcertResponseDataDto>} 생성된 공연 정보
   */
  async execute(props: CreateConcertUseCaseProps): Promise<CreateConcertResponseDataDto> {
    const { bodyDto } = props;

    const concert = await this.commandBus.execute(
      new CreateConcertCommand({
        title: bodyDto.title,
        venue: bodyDto.venue,
        startsAt: bodyDto.startsAt,
        endsAt: bodyDto.endsAt,
        description: bodyDto.description,
        seats: bodyDto.seats,
      }),
    );

    await this.initializeSeatStock(concert.seats.map((s) => s.id));

    this.logger.log(`Concert created: concertId=${concert.id}, seats=${concert.seats.length}`);

    return CreateConcertResponseDataDto.from({
      id: concert.id,
      title: concert.title,
      venue: concert.venue,
      startsAt: concert.startsAt,
      endsAt: concert.endsAt,
      seatCount: concert.seats.length,
    });
  }

  /**
   * 각 좌석의 Redis 재고를 1로 초기화
   *
   * @param {number[]} seatIds 초기화할 좌석 ID 목록
   */
  private async initializeSeatStock(seatIds: number[]): Promise<void> {
    await Promise.all(
      seatIds.map((seatId) => this.redisService.setStock(`${SEAT_STOCK_KEY_PREFIX}${seatId}:stock`, 1)),
    );
  }
}

interface CreateConcertUseCaseProps {
  bodyDto: CreateConcertRequestBodyDto;
}
