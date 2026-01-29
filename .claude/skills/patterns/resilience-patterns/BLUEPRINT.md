# Blueprint: resilience-patterns

> 런타임 에러, 무한대기, 네트워크 실패 등을 방지하는 코드 패턴 제공

---

## 요약

| 항목 | 값 |
|------|-----|
| 유형 | 스킬 (Skill) |
| 카테고리 | patterns |
| 목적 | 분산 시스템 및 네트워크 호출의 안정성 확보 패턴 제공 |
| 복잡도 | 중간 |
| 등급 | 🔴 Experimental (신규) |

---

## 상세 설계

### 역할 정의

이 스킬은 에이전트가 외부 API 호출, 데이터베이스 연결, 파일 시스템 접근 등의 코드를 작성할 때 **장애 복원력(Resilience)**을 갖춘 패턴을 적용하도록 지식을 제공합니다.

주요 적용 대상:
- Supabase API 호출
- PortOne 결제 API 연동
- SolAPI 문자 발송
- 외부 서비스 웹훅 처리

### 입출력

- **입력**: 외부 호출이 필요한 코드 작성 요청
- **출력**: Resilience 패턴이 적용된 TypeScript 코드

### 호환 에이전트

| 에이전트 | 사용 시나리오 |
|---------|--------------|
| forge (agent-smith) | 새 에이전트에 resilience 패턴 내장 |
| 설계 | API 통합 설계 시 패턴 참조 |
| auditor | 기존 코드의 resilience 검증 |

### 의존 스킬

- `api-patterns`: API 설계 기본 패턴 (선택적 참조)

---

## 패턴 목록

### 1. Retry Pattern (재시도 패턴)

#### 목적
일시적 실패(네트워크 불안정, 서버 과부하)에 대해 자동 재시도로 복구

#### 사용 시나리오
- API rate limit 도달 후 잠시 후 재시도
- 데이터베이스 연결 일시 끊김
- DNS 조회 일시 실패

#### TypeScript 구현

```typescript
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;      // ms
  maxDelay: number;       // ms
  backoffFactor: number;  // 지수 백오프 배수
  retryableErrors?: string[];
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', '429', '503', '504']
};

async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // 재시도 가능한 에러인지 확인
      const isRetryable = opts.retryableErrors?.some(
        code => lastError?.message?.includes(code)
      );

      if (!isRetryable || attempt === opts.maxRetries) {
        throw lastError;
      }

      // 지수 백오프 계산
      const delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffFactor, attempt),
        opts.maxDelay
      );

      // 지터 추가 (thundering herd 방지)
      const jitter = delay * 0.1 * Math.random();

      console.warn(
        `[Retry] Attempt ${attempt + 1}/${opts.maxRetries} failed. ` +
        `Retrying in ${Math.round(delay + jitter)}ms...`
      );

      await sleep(delay + jitter);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

#### 사용 예시

```typescript
// Supabase API 호출에 재시도 적용
const result = await withRetry(
  () => supabase.from('orders').select('*').eq('status', 'pending'),
  { maxRetries: 3, baseDelay: 500 }
);

// PortOne API 호출
const payment = await withRetry(
  () => portone.getPayment(paymentId),
  {
    maxRetries: 5,
    baseDelay: 1000,
    retryableErrors: ['429', '503', 'ECONNRESET']
  }
);
```

#### 주의사항

| 주의 | 설명 |
|------|------|
| 멱등성 확인 | 재시도해도 부작용이 없는 작업에만 적용 |
| POST 요청 주의 | 결제, 주문 생성 등은 중복 실행 위험 |
| 무한 재시도 금지 | maxRetries 반드시 설정 |
| 로깅 필수 | 재시도 횟수 모니터링 필요 |

---

### 2. Timeout Pattern (타임아웃 패턴)

#### 목적
무한 대기 상태 방지, 예측 가능한 응답 시간 보장

#### 사용 시나리오
- 느린 외부 API 응답 대기
- 데이터베이스 쿼리 지연
- 파일 업로드/다운로드

#### TypeScript 구현

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
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(
        `${operationName} timed out after ${timeoutMs}ms`,
        timeoutMs
      ));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

// AbortController 기반 (fetch 호출용)
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
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

#### 사용 예시

```typescript
// 일반 Promise에 타임아웃 적용
const user = await withTimeout(
  () => getUserById(userId),
  5000,
  'GetUser'
);

// Fetch 호출에 타임아웃 적용
const response = await fetchWithTimeout(
  'https://api.example.com/data',
  { method: 'GET' },
  10000  // 10초
);

// Supabase 호출에 타임아웃 적용
const orders = await withTimeout(
  () => supabase.from('orders').select('*'),
  8000,
  'FetchOrders'
);
```

#### 권장 타임아웃 값

| 작업 유형 | 권장 시간 | 근거 |
|----------|:---------:|------|
| 간단한 DB 조회 | 3-5초 | 인덱스 있는 쿼리 |
| 복잡한 DB 조회 | 10-15초 | JOIN, 집계 |
| 외부 API 호출 | 10-30초 | 네트워크 레이턴시 |
| 파일 업로드 | 60-120초 | 파일 크기 의존 |
| 결제 API | 30-60초 | PG사 처리 시간 |

#### 주의사항

| 주의 | 설명 |
|------|------|
| 너무 짧은 타임아웃 | 정상 요청도 실패할 수 있음 |
| 리소스 정리 | 타임아웃 후에도 원본 작업은 계속 실행될 수 있음 |
| 사용자 피드백 | 타임아웃 시 적절한 에러 메시지 제공 |

---

### 3. Fallback Pattern (폴백 패턴)

#### 목적
주 동작 실패 시 대체 동작으로 서비스 연속성 보장

#### 사용 시나리오
- 캐시 미스 시 DB 조회
- CDN 실패 시 원본 서버 접근
- 외부 API 실패 시 기본값 반환
- 결제 실패 시 대체 PG 시도

#### TypeScript 구현

```typescript
type FallbackFn<T> = () => Promise<T> | T;

interface FallbackOptions<T> {
  fallbacks: FallbackFn<T>[];
  defaultValue?: T;
  shouldFallback?: (error: Error) => boolean;
  onFallback?: (error: Error, fallbackIndex: number) => void;
}

async function withFallback<T>(
  primary: () => Promise<T>,
  options: FallbackOptions<T>
): Promise<T> {
  const { fallbacks, defaultValue, shouldFallback, onFallback } = options;

  // 주 동작 시도
  try {
    return await primary();
  } catch (primaryError) {
    const error = primaryError as Error;

    // 폴백 조건 확인
    if (shouldFallback && !shouldFallback(error)) {
      throw error;
    }

    // 폴백 순차 시도
    for (let i = 0; i < fallbacks.length; i++) {
      try {
        onFallback?.(error, i);
        return await fallbacks[i]();
      } catch {
        // 다음 폴백 시도
        continue;
      }
    }

    // 모든 폴백 실패 시 기본값 반환
    if (defaultValue !== undefined) {
      console.warn('[Fallback] All attempts failed, returning default value');
      return defaultValue;
    }

    throw error;
  }
}

// 간단한 버전: 단일 폴백
async function withSimpleFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T> | T
): Promise<T> {
  try {
    return await primary();
  } catch {
    return await fallback();
  }
}
```

#### 사용 예시

```typescript
// 캐시 -> DB 폴백
const userData = await withFallback(
  () => cache.get(`user:${userId}`),
  {
    fallbacks: [
      () => db.users.findUnique({ where: { id: userId } })
    ],
    onFallback: (error, index) => {
      console.log(`Cache miss, falling back to DB`);
    }
  }
);

// 다단계 폴백: CDN -> Origin -> 기본값
const imageUrl = await withFallback(
  () => fetchFromCDN(imageId),
  {
    fallbacks: [
      () => fetchFromOrigin(imageId),
      () => getPlaceholderImage()
    ],
    defaultValue: '/images/default.png'
  }
);

// 조건부 폴백 (특정 에러만)
const paymentResult = await withFallback(
  () => processPaymentWithPortOne(order),
  {
    fallbacks: [
      () => processPaymentWithBackupPG(order)
    ],
    shouldFallback: (error) =>
      error.message.includes('SERVICE_UNAVAILABLE') ||
      error.message.includes('TIMEOUT')
  }
);
```

#### 주의사항

| 주의 | 설명 |
|------|------|
| 데이터 일관성 | 폴백 결과가 주 결과와 형식이 같아야 함 |
| 성능 저하 가능 | 폴백은 보통 느림, 모니터링 필요 |
| 부분 실패 처리 | 주 동작 일부 성공 시 롤백 고려 |
| 기본값 주의 | 기본값이 비즈니스 로직에 영향 없는지 확인 |

---

### 4. Circuit Breaker Pattern (서킷 브레이커 패턴)

#### 목적
연속 실패 시 빠른 실패로 시스템 보호, 장애 전파 방지

#### 상태 다이어그램

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

#### 사용 시나리오
- 외부 서비스 장애 시 빠른 응답
- 데이터베이스 연결 풀 보호
- API rate limit 보호

#### TypeScript 구현

```typescript
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

interface CircuitBreakerOptions {
  failureThreshold: number;    // OPEN 전환 실패 횟수
  successThreshold: number;    // CLOSED 전환 성공 횟수
  timeout: number;             // OPEN 유지 시간 (ms)
  monitorInterval?: number;    // 모니터링 윈도우 (ms)
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly options: CircuitBreakerOptions;

  constructor(
    private readonly name: string,
    options: Partial<CircuitBreakerOptions> = {}
  ) {
    this.options = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
      monitorInterval: 60000,
      ...options
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // 상태 확인
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.options.timeout) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new CircuitBreakerError(
          `Circuit breaker [${this.name}] is OPEN`,
          this.state,
          this.getRemainingTimeout()
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
      if (this.successCount >= this.options.successThreshold) {
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
    console.log(
      `[CircuitBreaker:${this.name}] ${this.state} -> ${newState}`
    );
    this.state = newState;

    if (newState === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
    }
  }

  private getRemainingTimeout(): number {
    return Math.max(
      0,
      this.options.timeout - (Date.now() - this.lastFailureTime)
    );
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats(): object {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }
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
```

#### 사용 예시

```typescript
// 서킷 브레이커 인스턴스 생성 (서비스별)
const portoneBreaker = new CircuitBreaker('portone', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000
});

const supabaseBreaker = new CircuitBreaker('supabase', {
  failureThreshold: 10,
  successThreshold: 3,
  timeout: 30000
});

// 사용
async function processPayment(orderId: string) {
  try {
    return await portoneBreaker.execute(async () => {
      return await portone.createPayment(orderId);
    });
  } catch (error) {
    if (error instanceof CircuitBreakerError) {
      // 서킷 열림: 대체 처리
      console.error(`Payment circuit open, retry after ${error.retryAfterMs}ms`);
      throw new ServiceUnavailableError('결제 서비스 일시 중단');
    }
    throw error;
  }
}

// 여러 패턴 조합
async function fetchWithResilience<T>(
  circuitBreaker: CircuitBreaker,
  fn: () => Promise<T>,
  fallback: () => T
): Promise<T> {
  try {
    return await circuitBreaker.execute(() =>
      withTimeout(
        () => withRetry(fn, { maxRetries: 2 }),
        10000
      )
    );
  } catch (error) {
    if (error instanceof CircuitBreakerError) {
      return fallback();
    }
    throw error;
  }
}
```

#### 권장 설정값

| 서비스 유형 | failureThreshold | timeout | 근거 |
|------------|:----------------:|:-------:|------|
| 결제 API | 3-5 | 60초 | 중요도 높음, 빠른 차단 |
| 알림 서비스 | 10 | 30초 | 덜 중요, 느슨한 차단 |
| 캐시 서비스 | 20 | 10초 | 빠른 복구 예상 |
| DB 연결 | 5 | 30초 | 연결 풀 보호 |

#### 주의사항

| 주의 | 설명 |
|------|------|
| 임계값 튜닝 | 너무 낮으면 정상 트래픽도 차단 |
| 상태 공유 | 분산 환경에서 Redis 등으로 상태 공유 필요 |
| 모니터링 | 서킷 상태 변경 알림 설정 |
| 폴백 준비 | OPEN 상태의 대체 동작 필수 |

---

## 패턴 조합 가이드

### 권장 조합 순서

```
요청 -> [Circuit Breaker] -> [Timeout] -> [Retry] -> 실제 호출
                 |              |           |
                 v              v           v
           빠른 실패       무한대기 방지   일시 실패 복구
                                           |
                                           v
                                      [Fallback]
                                           |
                                           v
                                       대체 결과
```

### 조합 예시

```typescript
// 완전한 resilience 래퍼
async function resilientCall<T>(
  circuitBreaker: CircuitBreaker,
  fn: () => Promise<T>,
  options: {
    timeout: number;
    retryOptions?: Partial<RetryOptions>;
    fallback?: () => T | Promise<T>;
  }
): Promise<T> {
  const { timeout, retryOptions, fallback } = options;

  try {
    // 1. Circuit Breaker 확인
    return await circuitBreaker.execute(async () => {
      // 2. Timeout 적용
      return await withTimeout(async () => {
        // 3. Retry 적용
        return await withRetry(fn, retryOptions);
      }, timeout);
    });
  } catch (error) {
    // 4. Fallback 적용
    if (fallback) {
      console.warn('[Resilience] All strategies failed, using fallback');
      return await fallback();
    }
    throw error;
  }
}

// 사용
const orderData = await resilientCall(
  supabaseBreaker,
  () => supabase.from('orders').select('*').eq('id', orderId),
  {
    timeout: 5000,
    retryOptions: { maxRetries: 2, baseDelay: 500 },
    fallback: () => getCachedOrder(orderId)
  }
);
```

---

## 스킬 메타데이터

```yaml
name: resilience-patterns
description: 런타임 에러, 무한대기, 네트워크 실패 방지 패턴
category: patterns
compatible_agents: [forge, auditor, 설계]
dependencies: [api-patterns]
dna:
  lineage: [root]
  generation: 1
  mutations: []
  fitness_score: 0.5
```

---

## 검증 체크리스트

스킬 생성 전 확인:

```
[x] 각 패턴의 TypeScript 구현이 완전한가?
[x] 사용 시나리오가 프로젝트에 맞게 정의되었는가?
[x] 주의사항이 충분히 문서화되었는가?
[x] 패턴 조합 가이드가 포함되었는가?
[x] 권장 설정값이 제시되었는가?
```

---

## 다음 단계

1. `@strategist` - 이 스킬의 리소스 영향 검토 (optional)
2. `@skill-weaver` - BLUEPRINT 기반 SKILL.md 생성
3. `@auditor` - 코드 품질 및 보안 검증
4. `registry/skills.json` 업데이트

---

## 관련 스킬

| 스킬 | 관계 |
|------|------|
| api-patterns | 기본 API 설계 참조 |
| environment-validator | 환경 검증 (배포 전 체크) |
| security-rules | 보안 규칙 (에러 노출 방지) |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|:----:|----------|
| 2026-01-29 | 0.1.0 | 초기 청사진 설계 |
