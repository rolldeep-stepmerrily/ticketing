import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import Joi from 'joi';

import { GlobalCqrsModule } from './common/cqrs';
import { KafkaModule } from './common/kafka';
import { HttpLoggerMiddleware } from './common/middlewares';
import { PrismaModule } from './common/prisma';
import { RedisModule, RedisThrottlerStorage } from './common/redis';

@Module({
  imports: [
    RedisModule,
    ThrottlerModule.forRootAsync({
      inject: [RedisThrottlerStorage],
      useFactory: (redisThrottlerStorage: RedisThrottlerStorage) => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
        storage: redisThrottlerStorage,
      }),
    }),
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('local', 'development', 'production').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().optional(),
        KAFKA_BROKERS: Joi.string().required(),
        KAFKA_CLIENT_ID: Joi.string().required(),
        KAFKA_GROUP_ID: Joi.string().required(),
      }),
      isGlobal: true,
      envFilePath: '.env',
      validationOptions: { abortEarly: true },
    }),
    GlobalCqrsModule,
    PrismaModule,
    KafkaModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('{*splat}');
  }
}
