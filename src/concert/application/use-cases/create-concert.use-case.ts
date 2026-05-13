import { TypedCommandBus } from '@@cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { CreateConcertRequestBodyDto, CreateConcertResponseDataDto } from '../../presenter/http/dto/create-concert.dto';
import { CreateConcertCommand } from '../commands/create-concert.command';

@Injectable()
export class CreateConcertUseCase {
  private readonly logger = new Logger(CreateConcertUseCase.name);

  constructor(private readonly commandBus: TypedCommandBus<CreateConcertCommand>) {}

  /**
   * 공연 생성 (DB + Redis 재고 초기화는 Command 핸들러 트랜잭션 내부에서 atomic 하게 처리)
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
}

interface CreateConcertUseCaseProps {
  bodyDto: CreateConcertRequestBodyDto;
}
