import { User } from '@@decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TypedCommandBus, TypedQueryBus } from 'src/common/cqrs';
import { JwtGuard } from 'src/common/guards';
import { CancelBookingCommand } from '../../application/use-cases/cancel-booking/cancel-booking.command';
import {
  CreateBookingCommand,
  CreateBookingResult,
} from '../../application/use-cases/create-booking/create-booking.command';
import {
  GetMyBookingsQuery,
  GetMyBookingsResult,
} from '../../application/use-cases/get-my-bookings/get-my-bookings.query';
import { CreateBookingDto } from './dto/create-booking.dto';

type BookingCommand = CreateBookingCommand | CancelBookingCommand;
type BookingQuery = GetMyBookingsQuery;

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtGuard)
export class BookingHttpController {
  constructor(
    private readonly commandBus: TypedCommandBus<BookingCommand>,
    private readonly queryBus: TypedQueryBus<BookingQuery>,
  ) {}

  @ApiOperation({ summary: '티켓 예매' })
  @Post()
  async createBooking(@User('id') userId: number, @Body() dto: CreateBookingDto): Promise<CreateBookingResult> {
    return await this.commandBus.execute(new CreateBookingCommand(userId, dto.seatId));
  }

  @ApiOperation({ summary: '예매 취소' })
  @Delete(':ticketId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelBooking(@User('id') userId: number, @Param('ticketId', ParseIntPipe) ticketId: number): Promise<void> {
    await this.commandBus.execute(new CancelBookingCommand(userId, ticketId));
  }

  @ApiOperation({ summary: '내 예매 내역 조회' })
  @Get('me')
  async getMyBookings(@User('id') userId: number): Promise<GetMyBookingsResult> {
    return await this.queryBus.execute(new GetMyBookingsQuery(userId));
  }
}
