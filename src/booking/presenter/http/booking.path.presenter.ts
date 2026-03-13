export const BookingRouter = {
  Root: 'bookings',
  HttpApiTags: 'Bookings',
  Http: {
    Create: '',
    Cancel: ':ticketId',
    GetMyBookings: 'me',
  },
} as const;
