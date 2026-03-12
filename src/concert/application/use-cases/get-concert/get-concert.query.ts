import { Query } from '@nestjs/cqrs';
import { QueryProps } from 'src/common/cqrs/query-props';

export interface GetConcertResult {
  id: number;
  title: string;
  description: string | null;
  venue: string;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
}

export class GetConcertQuery extends Query<GetConcertResult> {
  constructor(public readonly concertId: number) {
    super();
  }
}

export type GetConcertQueryProps = QueryProps<GetConcertQuery>;
