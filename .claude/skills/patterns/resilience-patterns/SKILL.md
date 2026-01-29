---
name: resilience-patterns
description: 런타임 에러, 무한대기, 네트워크 실패 방지를 위한 복원력 패턴. Retry, Timeout, Fallback, Circuit Breaker 구현 제공.
category: patterns
compatible_agents: [forge, auditor, architect]
dependencies: []
dna:
  lineage: [root]
  generation: 1
  mutations: []
  fitness_score: 0.5
---

# Resilience Patterns

> 분산 시스템 및 네트워크 호출의 안정성을 확보하는 장애 복원력 패턴

## 목적

외부 API 호출, 데이터베이스 연결, 파일 시스템 접근 등에서 발생하는:
- 일시적 네트워크 실패 자동 복구
- 무한 대기 상태 방지
- 연쇄 장애 전파 차단
- 서비스 연속성 보장

적용 대상: Supabase API, PortOne 결제, SolAPI 문자 발송, 외부 웹훅

---

## 패턴 1: Retry (재시도)

### 목적

일시적 실패(네트워크 불안정, 서버 과부하)에 대해 자동 재시도로 복구

### 구현

```typescript
interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;      // ms
  maxDelay?: number;      // ms (기본: 30000)
  backoffFactor?: number; // 지수 백오프 배수 (기본: 2)
  retryableErrors?: string[];
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxAttempts,
    baseDelay,
    maxDelay = 30000,
    backoffFactor = 2,
    retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', '429', '503', '504']
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      const isRetryable = retryableErrors.some(
        code => lastError?.message?.includes(code)
      );

      if (!isRetryable || attempt === maxAttempts - 1) {
        throw lastError;
      }

      // 지수 백오프 + 지터 (thundering herd 방지)
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );
      const jitter = delay * 0.1 * Math.random();

      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError;
}
```

### 사용 예시

```typescript
// Supabase 호출
const result = await withRetry(
  () => supabase.from('orders').select('*').eq('status', 'pending'),
  { maxAttempts: 3, baseDelay: 500 }
);

// PortOne API
const payment = await withRetry(
  () => portone.getPayment(paymentId),
  { maxAttempts: 5, baseDelay: 1000, retryableErrors: ['429', '503'] }
);
```

### 주의사항

| 주의 | 설명 |
|------|------|
| 멱등성 확인 | 재시도해도 부작용이 없는 작업에만 적용 |
| POST 요청 주의 | 결제, 주문 생성 등은 중복 실행 위험 |
| maxAttempts 필수 | 무한 재시도 금지 |

---

## 패턴 2: Timeout (타임아웃)

### 목적

무한 대기 상태 방지, 예측 가능한 응답 시간 보장

### 구현

```typescript
class TimeoutError extends Error {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  operationName: string = 'Operation'
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new TimeoutError(
            `${operationName} timed out after ${timeoutMs}ms`,
            timeoutMs
          ));
        });
      })
    ]);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Fetch 전용 (AbortController 활용)
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(`Fetch to ${url} timed out`, timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### 사용 예시

```typescript
// 일반 Promise
const user = await withTimeout(
  () => getUserById(userId),
  5000,
  'GetUser'
);

// Fetch 호출
const response = await fetchWithTimeout(
  'https://api.example.com/data',
  { method: 'GET' },
  10000
);
```

### 권장 타임아웃 값

| 작업 유형 | 권장 시간 | 근거 |
|----------|:---------:|------|
| 간단한 DB 조회 | 3-5초 | 인덱스 쿼리 |
| 복잡한 DB 조회 | 10-15초 | JOIN, 집계 |
| 외부 API 호출 | 10-30초 | 네트워크 레이턴시 |
| 결제 API | 30-60초 | PG사 처리 시간 |

---

## 패턴 3: Fallback (폴백)

### 목적

주 동작 실패 시 대체 동작으로 서비스 연속성 보장

### 구현

```typescript
async function withFallback<T>(
  primary: () => Promise<T>,
  fallbacks: Array<() => Promise<T> | T>,
  options?: {
    shouldFallback?: (error: Error) => boolean;
    onFallback?: (error: Error, index: number) => void;
  }
): Promise<T> {
  const { shouldFallback, onFallback } = options ?? {};

  try {
    return await primary();
  } catch (primaryError) {
    const error = primaryError as Error;

    if (shouldFallback && !shouldFallback(error)) {
      throw error;
    }

    for (let i = 0; i < fallbacks.length; i++) {
      try {
        onFallback?.(error, i);
        return await fallbacks[i]();
      } catch {
        continue;
      }
    }

    throw error;
  }
}
```

### 사용 예시

```typescript
// 캐시 -> DB 폴백
const userData = await withFallback(
  () => cache.get(`user:${userId}`),
  [() => db.users.findUnique({ where: { id: userId } })]
);

// 다단계 폴백: CDN -> Origin -> 기본값
const imageUrl = await withFallback(
  () => fetchFromCDN(imageId),
  [
    () => fetchFromOrigin(imageId),
    () => '/images/default.png'
  ]
);

// 조건부 폴백 (특정 에러만)
const payment = await withFallback(
  () => processWithPortOne(order),
  [() => processWithBackupPG(order)],
  {
    shouldFallback: (err) =>
      err.message.includes('SERVICE_UNAVAILABLE')
  }
);
```

### 주의사항

| 주의 | 설명 |
|------|------|
| 데이터 일관성 | 폴백 결과 형식이 주 결과와 동일해야 함 |
| 성능 저하 | 폴백은 보통 느림, 모니터링 필요 |

---

## 패턴 4: Circuit Breaker (서킷 브레이커)

### 목적

연속 실패 시 빠른 실패로 시스템 보호, 장애 전파 방지

### 상태 다이어그램

```
     성공
  +--------+
  |        v
CLOSED --> OPEN --> HALF-OPEN
  ^                    |
  |     성공           |
  +--------------------+
         실패 -> OPEN
```

| 상태 | 동작 |
|------|------|
| CLOSED | 정상 동작, 실패 카운트 |
| OPEN | 즉시 실패 반환 (대기 시간 동안) |
| HALF-OPEN | 테스트 요청 1개 허용 |

### 구현

```typescript
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly state: CircuitState,
    public readonly retryAfterMs: number
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

interface CircuitBreakerOptions {
  failureThreshold: number;  // OPEN 전환 실패 횟수
  resetTimeout: number;      // OPEN 유지 시간 (ms)
  successThreshold?: number; // CLOSED 전환 성공 횟수 (기본: 2)
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;

  constructor(
    private readonly name: string,
    private readonly options: CircuitBreakerOptions
  ) {
    this.options.successThreshold ??= 2;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new CircuitBreakerError(
          `Circuit [${this.name}] is OPEN`,
          this.state,
          this.options.resetTimeout - (Date.now() - this.lastFailureTime)
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold!) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;
    if (this.failureCount >= this.options.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  private transitionTo(newState: CircuitState): void {
    console.log(`[CircuitBreaker:${this.name}] ${this.state} -> ${newState}`);
    this.state = newState;
    if (newState === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
    }
  }

  getState(): CircuitState { return this.state; }
}
```

### 사용 예시

```typescript
// 서비스별 인스턴스 생성
const portoneBreaker = new CircuitBreaker('portone', {
  failureThreshold: 5,
  resetTimeout: 60000
});

const supabaseBreaker = new CircuitBreaker('supabase', {
  failureThreshold: 10,
  resetTimeout: 30000
});

// 사용
async function processPayment(orderId: string) {
  try {
    return await portoneBreaker.execute(
      () => portone.createPayment(orderId)
    );
  } catch (error) {
    if (error instanceof CircuitBreakerError) {
      throw new Error('결제 서비스 일시 중단');
    }
    throw error;
  }
}
```

### 권장 설정값

| 서비스 유형 | failureThreshold | resetTimeout | 근거 |
|------------|:----------------:|:------------:|------|
| 결제 API | 3-5 | 60초 | 중요도 높음 |
| 알림 서비스 | 10 | 30초 | 덜 중요 |
| 캐시 서비스 | 20 | 10초 | 빠른 복구 예상 |
| DB 연결 | 5 | 30초 | 연결 풀 보호 |

---

## 패턴 조합

### 권장 순서

```
요청 -> [Circuit Breaker] -> [Timeout] -> [Retry] -> 실제 호출
                                                         |
                                                    [Fallback]
```

### 통합 래퍼

```typescript
async function resilientCall<T>(
  circuitBreaker: CircuitBreaker,
  fn: () => Promise<T>,
  options: {
    timeoutMs: number;
    retryOptions?: { maxAttempts: number; baseDelay: number };
    fallback?: () => T | Promise<T>;
  }
): Promise<T> {
  try {
    return await circuitBreaker.execute(async () => {
      return await withTimeout(async () => {
        if (options.retryOptions) {
          return await withRetry(fn, options.retryOptions);
        }
        return await fn();
      }, options.timeoutMs);
    });
  } catch (error) {
    if (options.fallback && error instanceof CircuitBreakerError) {
      return await options.fallback();
    }
    throw error;
  }
}

// 사용
const orderData = await resilientCall(
  supabaseBreaker,
  () => supabase.from('orders').select('*').eq('id', orderId),
  {
    timeoutMs: 5000,
    retryOptions: { maxAttempts: 3, baseDelay: 500 },
    fallback: () => getCachedOrder(orderId)
  }
);
```

---

## 제약 조건

- 멱등성이 보장되지 않는 작업에는 Retry 적용 금지
- Circuit Breaker 상태는 인스턴스별 (분산 환경에서는 Redis 공유 필요)
- Timeout 후에도 원본 작업은 계속 실행될 수 있음 (리소스 주의)
- 모든 패턴 적용 시 로깅/모니터링 필수

---

## 관련 스킬

- environment-validator: 배포 전 환경 설정 검증
- security-rules: 에러 메시지 노출 방지 규칙
