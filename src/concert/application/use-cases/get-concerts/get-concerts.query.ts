import { Query } from '@nestjs/cqrs';
import { QueryProps } from 'src/common/cqrs/query-props';

export interface ConcertItem {
  id: number;
  title: string;
  venue: string;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
}

export interface GetConcertsResult {
  data: ConcertItem[];
  total: number;
}

export class GetConcertsQuery extends Query<GetConcertsResult> {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
  ) {
    super();
  }
}

export type GetConcertsQueryProps = QueryProps<GetConcertsQuery>;
