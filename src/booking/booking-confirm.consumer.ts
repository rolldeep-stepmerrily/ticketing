import { TicketStatus } from '@@prisma';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { KafkaConsumerService } from 'src/common/kafka';
import { PrismaService } from 'src/common/prisma';

interface BookingCreatedPayload {
  ticketId: number;
  userId: number;
  seatId: number;
  concertId: number;
}

@Injectable()
export class BookingConfirmConsumer implements OnModuleInit {
  private readonly logger = new Logger(BookingConfirmConsumer.name);

  constructor(
    private readonly kafkaConsumerService: KafkaConsumerService,
    private readonly prismaService: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaConsumerService.subscribe(
      { topics: ['ticketing.booking.created'], fromBeginning: false },
      async ({ message }) => {
        if (!message.value) return;

        const payload = JSON.parse(message.value.toString()) as BookingCreatedPayload;
        const { ticketId } = payload;

        await this.prismaService.ticket.updateMany({
          where: { id: ticketId, status: TicketStatus.PENDING },
          data: { status: TicketStatus.CONFIRMED },
        });

        this.logger.log(`Ticket confirmed: ticketId=${ticketId}`);
      },
    );
  }
}
