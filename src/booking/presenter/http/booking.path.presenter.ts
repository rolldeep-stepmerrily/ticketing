export const BookingRouter = {
  Root: 'bookings',
  HttpApiTags: 'Bookings',
  Http: {
    Create: '',
    Cancel: ':ticketId',
    GetMyBookings: 'me',
  },
  Event: {
    BookingCreated: 'ticketing.booking.created',
    BookingCancelled: 'ticketing.booking.cancelled',
  },
} as const;
