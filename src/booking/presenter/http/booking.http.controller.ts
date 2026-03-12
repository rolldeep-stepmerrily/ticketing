import { User } from '@@decorators';
import { JwtGuard } from '@@guards';
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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CancelBookingUseCase } from '../../application/use-cases/cancel-booking.use-case';
import { CreateBookingUseCase } from '../../application/use-cases/create-booking.use-case';
import { GetMyBookingsUseCase } from '../../application/use-cases/get-my-bookings.use-case';
import { BookingRouter } from './booking.path.presenter';
import { CreateBookingRequestBodyDto, CreateBookingResponseDataDto } from './dto/create-booking.dto';
import { GetMyBookingsResponseDataDto } from './dto/get-my-bookings.dto';

@ApiTags(BookingRouter.HttpApiTags)
@ApiBearerAuth('accessToken')
@Controller(BookingRouter.Root)
@UseGuards(JwtGuard)
export class BookingHttpController {
  constructor(
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly cancelBookingUseCase: CancelBookingUseCase,
    private readonly getMyBookingsUseCase: GetMyBookingsUseCase,
  ) {}

  /**
   * 티켓 예매 엔드포인트
   *
   * @param {number} userId 인증된 사용자 ID
   * @param {CreateBookingRequestBodyDto} bodyDto 예매 요청 데이터
   * @returns {Promise<CreateBookingResponseDataDto>} 생성된 티켓 정보
   */
  @ApiOperation({ summary: '티켓 예매' })
  @ApiBody({ type: CreateBookingRequestBodyDto })
  @Post(BookingRouter.Http.Create)
  async createBooking(
    @User('id') userId: number,
    @Body() bodyDto: CreateBookingRequestBodyDto,
  ): Promise<CreateBookingResponseDataDto> {
    return await this.createBookingUseCase.execute({ userId, seatId: bodyDto.seatId });
  }

  /**
   * 예매 취소 엔드포인트
   *
   * @param {number} userId 인증된 사용자 ID
   * @param {number} ticketId 취소할 티켓 ID
   */
  @ApiOperation({ summary: '예매 취소' })
  @Delete(BookingRouter.Http.Cancel)
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelBooking(@User('id') userId: number, @Param('ticketId', ParseIntPipe) ticketId: number): Promise<void> {
    await this.cancelBookingUseCase.execute({ userId, ticketId });
  }

  /**
   * 내 예매 내역 조회 엔드포인트
   *
   * @param {number} userId 인증된 사용자 ID
   * @returns {Promise<GetMyBookingsResponseDataDto>} 예매 내역
   */
  @ApiOperation({ summary: '내 예매 내역 조회' })
  @Get(BookingRouter.Http.GetMyBookings)
  async getMyBookings(@User('id') userId: number): Promise<GetMyBookingsResponseDataDto> {
    return await this.getMyBookingsUseCase.execute({ userId });
  }
}
