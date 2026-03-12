export const ConcertRouter = {
  Root: 'concerts',
  HttpApiTags: 'Concerts',
  Http: {
    GetList: '',
    GetOne: ':id',
    GetSeats: ':id/seats',
  },
} as const;
