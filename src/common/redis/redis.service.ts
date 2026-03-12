import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  constructor(private readonly configService: ConfigService) {}

  /**
   * 모듈 초기화 시 Redis 클라이언트를 생성
   */
  onModuleInit(): void {
    const password = this.configService.get<string>('REDIS_PASSWORD');

    this.client = new Redis({
      host: this.configService.getOrThrow<string>('REDIS_HOST'),
      port: this.configService.getOrThrow<number>('REDIS_PORT'),
      ...(password !== undefined && { password }),
      lazyConnect: true,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  /**
   * Redis 클라이언트 반환
   *
   * @returns {Redis} ioredis 클라이언트
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Access token을 블랙리스트에 추가
   *
   * @param {string} token Access token
   * @param {number} ttlSeconds 만료까지 남은 초
   */
  async addToBlacklist(token: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) {
      return;
    }

    await this.client.set(`blacklist:${token}`, '1', 'EX', ttlSeconds);
  }

  /**
   * Access token이 블랙리스트에 있는지 확인
   *
   * @param {string} token Access token
   * @returns {Promise<boolean>} 블랙리스트 여부
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.client.exists(`blacklist:${token}`);

    return result === 1;
  }
}
