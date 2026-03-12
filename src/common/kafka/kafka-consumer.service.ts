import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, ConsumerSubscribeTopics, EachMessagePayload, Kafka } from 'kafkajs';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumer!: Consumer;

  constructor(private readonly configService: ConfigService) {}

  /**
   * 모듈 초기화 시 Kafka Consumer 연결
   */
  async onModuleInit(): Promise<void> {
    const kafka = new Kafka({
      clientId: this.configService.getOrThrow<string>('KAFKA_CLIENT_ID'),
      brokers: this.configService.getOrThrow<string>('KAFKA_BROKERS').split(','),
    });

    this.consumer = kafka.consumer({
      groupId: this.configService.getOrThrow<string>('KAFKA_GROUP_ID'),
    });

    await this.consumer.connect();
    this.logger.log('Kafka Consumer connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
  }

  /**
   * 토픽 구독 및 메시지 핸들러 등록
   *
   * @param {ConsumerSubscribeTopics} topics 구독할 토픽 설정
   * @param {(payload: EachMessagePayload) => Promise<void>} handler 메시지 처리 핸들러
   */
  async subscribe(
    topics: ConsumerSubscribeTopics,
    handler: (payload: EachMessagePayload) => Promise<void>,
  ): Promise<void> {
    await this.consumer.subscribe(topics);
    await this.consumer.run({ eachMessage: handler });
  }
}
