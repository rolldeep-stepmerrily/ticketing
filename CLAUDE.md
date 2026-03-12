# Ticketing

Redis, Kafka, CQRS를 활용한 공연 예매/선착순 티켓팅 시스템.

## 프로젝트 구조

```
ticketing/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   └── common/
│       ├── cqrs/         # TypedCommandBus, TypedQueryBus, GlobalCqrsModule
│       ├── decorators/   # @@decorators
│       ├── entities/     # @@entities
│       ├── exceptions/   # @@exceptions — AppException, GLOBAL_ERRORS
│       ├── filters/      # HttpExceptionFilter (전역)
│       ├── interceptors/ # TransformInterceptor (전역)
│       ├── kafka/        # KafkaModule, KafkaProducerService
│       ├── middlewares/  # HttpLoggerMiddleware
│       ├── prisma/       # PrismaModule, PrismaService
│       └── redis/        # RedisModule, RedisService, RedisThrottlerStorage
├── prisma/
│   └── schema.prisma
├── docker-compose.yml    # PostgreSQL + Redis + Kafka + Zookeeper + Kafka UI
└── .env.example
```

## 에이전트 & 스킬

| 이름 | 경로 | 용도 |
|------|------|------|
| `code-reviewer` | `.claude/agents/code-reviewer.md` | 코드 리뷰 |
| `general-convention` | `.claude/skills/code-convention/general-convention/SKILL.md` | TS 코딩 컨벤션 |
| `jsdoc-convention` | `.claude/skills/code-convention/jsdoc-convention/SKILL.md` | JSDoc 작성 규칙 |
| `commit-convention` | `.claude/skills/git-convention/commit-convention/SKILL.md` | 커밋/브랜치 컨벤션 |
| `pull-request-convention` | `.claude/skills/git-convention/pull-request-convention/SKILL.md` | PR 생성 워크플로우 |
| `nestjs-cqrs` | `.claude/skills/be-convention/nestjs-cqrs/SKILL.md` | NestJS CQRS + UseCase 아키텍처 패턴 |

## Git 브랜치 전략

- **PR base 브랜치**: 항상 `develop` (핫픽스/릴리스만 `main`)

## 패키지 매니저

**pnpm** 사용. npm/yarn 사용 금지.

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm check
pnpm db:migrate
pnpm db:generate
```

## 기술 스택

| 영역 | 기술 |
|---|---|
| Backend | NestJS, Prisma, PostgreSQL, Redis, Kafka |
| CQRS | @nestjs/cqrs |
| Message Queue | KafkaJS |
| Cache / Lock | ioredis |
| DB | PostgreSQL (Prisma) |
| API Docs | Scalar (`/docs`, 개발 환경만) |

## Biome 설정

- indent: 2 spaces, lineWidth: 120, quote: single, trailingCommas: all, semicolons: always
- `*.strategy.ts`, `*.controller.ts`, `*.service.ts`, `*.error.ts` → `useExplicitType: error`

---

## NestJS 아키텍처

### Path Aliases

```typescript
import { AppException, GLOBAL_ERRORS } from '@@exceptions';
import { User } from '@@decorators';
import { BaseEntity } from '@@entities';
```

### CQRS + UseCase 패턴

엔드포인트 1개 = UseCase 1개 (1:1 대응)

```
src/<feature>/
├── presenter/
│   └── http/
│       ├── <feature>.http-controller.ts
│       └── dto/
├── application/
│   └── use-cases/
│       ├── <use-case>.handler.ts    # CommandHandler 또는 QueryHandler
│       └── <use-case>.command.ts    # 또는 query.ts
└── <feature>.module.ts
```

### 에러 처리

`AppException` 사용 통일. `new Error()` / `HttpException` 직접 사용 금지.

```typescript
// src/<feature>/<feature>.error.ts
export const CONCERT_ERRORS = {
  NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'CONCERT_NOT_FOUND',
    message: 'Concert not found',
  },
};

throw new AppException(CONCERT_ERRORS.NOT_FOUND);
```

### Kafka 패턴

- **Producer**: `KafkaProducerService.send(topic, message)` — 이벤트 발행
- **Consumer**: 각 모듈에서 `KafkaProducerService.getProducer()` 또는 별도 Consumer Service 구현
- Kafka 토픽 이름: `ticketing.<domain>.<event>` (예: `ticketing.booking.created`)

### Redis 패턴

- **재고 감소**: `DECR` + Lua script (atomic)
- **분산 락**: `SET NX EX` (예매 중복 방지)
- **블랙리스트**: access token 무효화

### 환경 변수

새 env 변수는 `app.module.ts` Joi 스키마에 반드시 추가.

```typescript
this.configService.getOrThrow<string>('MY_ENV');
```

## Docker

```bash
docker-compose up -d    # PostgreSQL + Redis + Kafka 실행
# Kafka UI: http://localhost:8080
```
