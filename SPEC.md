# Ticketing System — 기술 명세

## 개요

선착순 공연 티켓팅 시스템. 동시 다발적인 예매 요청에서 중복 예매 방지와 재고 정합성을 보장하는 것이 핵심 목표.

---

## 도메인 모델

### User
| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| email | String | 고유 이메일 |
| name | String | 이름 |
| password | String | 해시된 비밀번호 |

### RefreshToken
| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| userId | Int | 유저 FK |
| tokenHash | String | SHA-256 해시 (unique) |
| expiresAt | DateTime | 만료 시각 |

### Concert
| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| title | String | 공연명 |
| description | String? | 공연 설명 |
| venue | String | 공연 장소 |
| startsAt | DateTime | 공연 시작 시각 |
| endsAt | DateTime | 공연 종료 시각 |

### Seat
| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| concertId | Int | 공연 FK |
| row | String | 좌석 열 (예: A, B) |
| number | Int | 좌석 번호 |
| grade | SeatGrade | VIP / R / S / A |
| price | Int | 가격 (원) |
| status | SeatStatus | AVAILABLE / RESERVED / SOLD |

### Ticket
| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| userId | Int | 유저 FK |
| seatId | Int | 좌석 FK (unique) |
| status | TicketStatus | PENDING / CONFIRMED / CANCELLED |

### OutboxEvent
| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| aggregateId | String | 집계 ID (예: ticketId) |
| eventType | String | 이벤트 타입 (예: ticketing.booking.created) |
| payload | Json | 이벤트 페이로드 |
| publishedAt | DateTime? | 발행 시각 (null이면 미발행) |

---

## API 명세

### Auth (인증)

| Method | Path | 설명 |
|---|---|---|
| `POST` | `/auth/register` | 회원가입 |
| `POST` | `/auth/login` | 로그인 (토큰 발급) |
| `POST` | `/auth/logout` | 로그아웃 (토큰 무효화) |
| `POST` | `/auth/refresh` | 토큰 재발급 (Refresh Token Rotation) |

### Concert

| Method | Path | 설명 |
|---|---|---|
| `POST` | `/concerts` | 공연 등록 (어드민, 좌석 + Redis 재고 초기화 포함) |
| `GET` | `/concerts` | 공연 목록 조회 |
| `GET` | `/concerts/:id` | 공연 상세 조회 |
| `GET` | `/concerts/:id/seats` | 좌석 목록 조회 |

### Booking (예매)

| Method | Path | 설명 |
|---|---|---|
| `POST` | `/bookings` | 티켓 예매 |
| `DELETE` | `/bookings/:ticketId` | 예매 취소 |
| `GET` | `/bookings/me` | 내 예매 내역 조회 |

---

## 동시성 제어 전략

### 1. 좌석 재고 감소 — Redis Lua script (atomic)

좌석 예매 시 Redis에서 atomic하게 재고를 감소시켜 oversell을 방지.

```
key: ticketing:seat:{seatId}:stock
```

```lua
-- 키 미존재 시 initialStock으로 초기화 후 감소
local stock = redis.call('GET', KEYS[1])
if stock == false then
  if tonumber(ARGV[1]) <= 0 then
    return 0
  end
  redis.call('SET', KEYS[1], tonumber(ARGV[1]) - 1)
  return 1
end
if tonumber(stock) <= 0 then
  return 0
end
redis.call('DECR', KEYS[1])
return 1  -- 성공 시 1, 실패 시 0
```

### 2. 중복 예매 방지 — Redis SET NX EX (분산 락)

동일 좌석에 대한 동시 예매를 방지.

```
key: ticketing:lock:seat:{seatId}
TTL: 10s
```

- 락 획득 성공 → 예매 처리 진행
- 락 획득 실패 → 409 Conflict 반환

### 3. 이벤트 순서 보장 — Transactional Outbox + Kafka

DB 트랜잭션과 Kafka 발행의 원자성을 보장하는 Transactional Outbox 패턴 적용.

1. 티켓 생성/취소 시 DB 트랜잭션 내에서 OutboxEvent 테이블에 이벤트 기록
2. OutboxPublisherService (5초 주기 Cron)가 미발행 이벤트를 Kafka로 발행
3. 분산 락(Redis)으로 다중 인스턴스 Cron 중복 실행 방지

| Topic | 설명 |
|---|---|
| `ticketing.booking.created` | 예매 생성 → 티켓 확정 처리 |
| `ticketing.booking.cancelled` | 예매 취소 → 후속 처리 (알림/환불 등) |

---

## 아키텍처

### CQRS + UseCase 패턴

엔드포인트 1개 = UseCase 1개 (1:1 대응).

```
Command (쓰기): 예매 생성, 예매 취소, 공연 등록, 회원가입, 로그인, 로그아웃
Query  (읽기):  공연 조회, 좌석 조회, 내 예매 내역
```

### 요청 흐름 (예매 생성)

```
Client
  └─ POST /bookings
       └─ BookingHttpController
            └─ CreateBookingUseCase.execute()
                 ├─ Redis SET NX EX  (분산 락)
                 ├─ Redis Lua script (재고 감소)
                 ├─ Prisma INSERT    (Ticket + OutboxEvent, 트랜잭션)
                 └─ 실패 시 Redis INCR (재고 보상)
```

### Kafka Consumer 흐름

```
OutboxPublisherService (5초 Cron)
  └─ OutboxEvent 미발행 건 조회
       └─ KafkaProducerService.sendMessage()
            └─ BookingEventController (@EventPattern)
                 ├─ ticketing.booking.created → ConfirmBookingUseCase
                 └─ ticketing.booking.cancelled → HandleBookingCancelledUseCase
```

### 에러 처리

전역 `HttpExceptionFilter`가 모든 예외를 처리. 비즈니스 예외는 `AppException`만 사용.

```typescript
throw new AppException(BOOKING_ERRORS.SEAT_NOT_AVAILABLE);
```

응답 형식:

```json
{
  "statusCode": 409,
  "errorCode": "BOOKING_SEAT_NOT_AVAILABLE",
  "message": "Seat is not available"
}
```

---

## Rate Limiting

Redis 기반 `ThrottlerModule` 적용. 기본 정책: **분당 120 요청/IP**.

```
storage: RedisThrottlerStorage
ttl: 60,000ms
limit: 120
```
