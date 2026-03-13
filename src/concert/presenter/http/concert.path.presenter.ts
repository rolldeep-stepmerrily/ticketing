export const ConcertRouter = {
  Root: 'concerts',
  HttpApiTags: 'Concerts',
  Http: {
    Create: '',
    GetList: '',
    GetOne: ':id',
    GetSeats: ':id/seats',
  },
} as const;
