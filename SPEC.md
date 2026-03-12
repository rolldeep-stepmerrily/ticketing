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

---

## API 명세

### Concert

| Method | Path | 설명 |
|---|---|---|
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

### 1. 좌석 재고 감소 — Redis DECR + Lua script

좌석 예매 시 Redis에서 atomic하게 재고를 감소시켜 oversell을 방지.

```
key: ticketing:seat:{seatId}:stock
```

```lua
-- 재고 0 이하면 실패 반환
local stock = redis.call('GET', KEYS[1])
if not stock or tonumber(stock) <= 0 then
  return 0
end
return redis.call('DECR', KEYS[1])
```

### 2. 중복 예매 방지 — Redis SET NX EX (분산 락)

동일 유저가 같은 좌석을 동시에 예매하는 것을 방지.

```
key: ticketing:lock:seat:{seatId}:user:{userId}
TTL: 10s
```

- 락 획득 성공 → 예매 처리 진행
- 락 획득 실패 → 409 Conflict 반환

### 3. 이벤트 순서 보장 — Kafka

예매 이벤트를 Kafka로 발행해 순서를 보장하고 후속 처리(알림, 정산 등)를 비동기로 분리.

| Topic | 설명 |
|---|---|
| `ticketing.booking.created` | 예매 생성 |
| `ticketing.booking.cancelled` | 예매 취소 |

---

## 아키텍처

### CQRS 패턴

엔드포인트 1개 = UseCase 1개 (Command 또는 Query).

```
Command (쓰기): 예매 생성, 예매 취소
Query  (읽기):  공연 조회, 좌석 조회, 내 예매 내역
```

### 요청 흐름 (예매 생성)

```
Client
  └─ POST /bookings
       └─ BookingController
            └─ TypedCommandBus.execute(CreateBookingCommand)
                 └─ CreateBookingHandler
                      ├─ Redis SET NX EX  (분산 락)
                      ├─ Redis Lua DECR   (재고 감소)
                      ├─ Prisma INSERT    (Ticket 생성)
                      └─ KafkaProducer    (ticketing.booking.created 발행)
```

### 에러 처리

전역 `HttpExceptionFilter`가 모든 예외를 처리. 비즈니스 예외는 `AppException`만 사용.

```typescript
throw new AppException(BOOKING_ERRORS.SEAT_ALREADY_TAKEN);
```

응답 형식:

```json
{
  "statusCode": 409,
  "errorCode": "SEAT_ALREADY_TAKEN",
  "message": "The seat is already taken"
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
