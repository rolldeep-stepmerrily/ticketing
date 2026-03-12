import { Query } from '@nestjs/cqrs';
import { QueryProps } from 'src/common/cqrs/query-props';

export interface SeatItem {
  id: number;
  row: string;
  number: number;
  grade: string;
  price: number;
  status: string;
}

export interface GetConcertSeatsResult {
  data: SeatItem[];
}

export class GetConcertSeatsQuery extends Query<GetConcertSeatsResult> {
  constructor(public readonly concertId: number) {
    super();
  }
}

export type GetConcertSeatsQueryProps = QueryProps<GetConcertSeatsQuery>;
