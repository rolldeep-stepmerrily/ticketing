import { Query } from '@nestjs/cqrs';
import { QueryProps } from 'src/common/cqrs/query-props';

export interface BookingItem {
  id: number;
  status: string;
  createdAt: Date;
  seat: {
    id: number;
    row: string;
    number: number;
    grade: string;
    price: number;
    concert: {
      id: number;
      title: string;
      venue: string;
      startsAt: Date;
    };
  };
}

export interface GetMyBookingsResult {
  data: BookingItem[];
}

export class GetMyBookingsQuery extends Query<GetMyBookingsResult> {
  constructor(public readonly userId: number) {
    super();
  }
}

export type GetMyBookingsQueryProps = QueryProps<GetMyBookingsQuery>;
