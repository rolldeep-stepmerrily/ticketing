# Ticketing

Redis, Kafka, CQRS를 활용한 공연 예매/선착순 티켓팅 시스템

## 기술 스택

| 영역 | 기술 |
|---|---|
| Framework | NestJS |
| ORM | Prisma + PostgreSQL |
| Cache / Lock | Redis (ioredis) |
| Message Queue | Kafka (KafkaJS) |
| CQRS | @nestjs/cqrs |
| API Docs | Scalar (`/docs`, 개발 환경만) |
| Package Manager | pnpm |

## 시작하기

### 1. 환경 변수 설정

```bash
cp .env.example .env
```

### 2. 인프라 실행

```bash
docker-compose up -d
```

| 서비스 | 포트 |
|---|---|
| PostgreSQL | 5432 |
| Redis | 6379 |
| Kafka | 9092 |
| Kafka UI | 8080 |

### 3. DB 마이그레이션

```bash
pnpm db:migrate
pnpm db:generate
```

### 4. 서버 실행

```bash
pnpm dev
```

API 문서: http://localhost:3000/docs

## 스크립트

```bash
pnpm dev          # 개발 서버
pnpm build        # 프로덕션 빌드
pnpm lint         # biome lint
pnpm check        # biome check (자동 수정)
pnpm test         # jest
pnpm db:migrate   # Prisma 마이그레이션
pnpm db:generate  # Prisma 클라이언트 생성
```

## 프로젝트 구조

```
src/
├── common/
│   ├── cqrs/         # TypedCommandBus, TypedQueryBus, GlobalCqrsModule
│   ├── decorators/   # @User, @BooleanQuery, @CatchDatabaseErrors
│   ├── entities/     # BaseEntity
│   ├── exceptions/   # AppException, GLOBAL_ERRORS
│   ├── filters/      # HttpExceptionFilter (전역)
│   ├── interceptors/ # TransformInterceptor (전역)
│   ├── kafka/        # KafkaModule, KafkaProducerService, KafkaConsumerService
│   ├── middlewares/  # HttpLoggerMiddleware
│   ├── prisma/       # PrismaModule, PrismaService
│   └── redis/        # RedisModule, RedisService, RedisThrottlerStorage
└── <feature>/
    ├── presenter/http/         # Controller + DTO
    ├── application/use-cases/  # CommandHandler / QueryHandler
    └── <feature>.module.ts
```

## 환경 변수

| 변수 | 설명 | 기본값 |
|---|---|---|
| `NODE_ENV` | 환경 (`local`\|`development`\|`production`) | `development` |
| `PORT` | 서버 포트 | `3000` |
| `DATABASE_URL` | PostgreSQL 연결 URL | — |
| `REDIS_HOST` | Redis 호스트 | — |
| `REDIS_PORT` | Redis 포트 | `6379` |
| `REDIS_PASSWORD` | Redis 비밀번호 | — |
| `KAFKA_BROKERS` | Kafka 브로커 주소 | — |
| `KAFKA_CLIENT_ID` | Kafka 클라이언트 ID | — |
| `KAFKA_GROUP_ID` | Kafka 컨슈머 그룹 ID | — |
