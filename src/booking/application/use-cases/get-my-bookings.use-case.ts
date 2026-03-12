import { Injectable } from '@nestjs/common';

import { TypedQueryBus } from '@@cqrs';
import { GetMyBookingsResponseDataDto } from '../../presenter/http/dto/get-my-bookings.dto';
import { GetMyBookingsQuery } from '../queries/get-my-bookings.query';

@Injectable()
export class GetMyBookingsUseCase {
  constructor(private readonly queryBus: TypedQueryBus<GetMyBookingsQuery>) {}

  /**
   * 내 예매 내역 조회 실행
   *
   * @param {GetMyBookingsUseCaseProps} props 조회 파라미터
   * @returns {Promise<GetMyBookingsResponseDataDto>} 예매 내역 응답
   */
  async execute(props: GetMyBookingsUseCaseProps): Promise<GetMyBookingsResponseDataDto> {
    const bookings = await this.fetchMyBookings(props.userId);

    return this.buildResponseDto(bookings);
  }

  /**
   * 내 예매 내역 데이터 조회
   *
   * @param {number} userId 사용자 ID
   * @returns {Promise<BookingData[]>} 예매 목록
   */
  private async fetchMyBookings(userId: number): Promise<BookingData[]> {
    return await this.queryBus.execute(new GetMyBookingsQuery({ userId }));
  }

  /**
   * 응답 DTO 생성
   *
   * @param {BookingData[]} bookings 예매 데이터
   * @returns {GetMyBookingsResponseDataDto} 응답 DTO
   */
  private buildResponseDto(bookings: BookingData[]): GetMyBookingsResponseDataDto {
    return GetMyBookingsResponseDataDto.from(bookings);
  }
}

interface GetMyBookingsUseCaseProps {
  userId: number;
}

type BookingData = {
  id: number;
  status: string;
  createdAt: Date;
  seat: {
    id: number;
    row: string;
    number: number;
    grade: string;
    price: number;
    concert: { id: number; title: string; venue: string; startsAt: Date };
  };
};
