# Acceptance: SPEC-KTO-002 (KTO MCP 서버 2차 이터레이션 — 무장애 여행 정보)

본 문서는 SPEC-KTO-002 의 요구사항이 만족되었음을 검증하기 위한 Given/When/Then
시나리오, 엣지 케이스, 그리고 정량 기준을 정의한다. 모든 시나리오는 자동화된 Jest
테스트(단위 또는 e2e)로 구현되어야 하며, 통과 여부가 SPEC 수용 가부의 1차 판정 기준이다.

본 SPEC 의 핵심 보호 대상은 **SPEC-KTO-001 회귀 무사고** 이다. 따라서 acceptance
시나리오는 (1) KorWithService2 신규 동작 검증과 (2) KorService2 회귀 검증을 양 축으로 구성한다.

---

## 1. Acceptance Scenarios (Given/When/Then)

### Scenario 1: BASE_URL_MAP refactor 후 SPEC-KTO-001 회귀 무사고 (REQ-UNW-002)

**Given** `src/kto/common/constants.ts` 의 `BASE_URL_MAP` 에 `KorWithService2` 항목 1줄이 추가되고 `@MX:NOTE` 주석이 갱신된 상태에서,
**When** `pnpm test`, `pnpm test:cov`, `pnpm test:e2e` 를 실행하면,
**Then**
- SPEC-KTO-001 시점의 76 unit + 6 e2e 테스트가 **모두 PASS** 한다.
- 어떤 기존 테스트의 어떤 assertion 도 수정되지 않았다 (Grep `git diff` 로 검증 가능).
- statements 커버리지가 SPEC-KTO-001 의 95.41% 대비 유의미한 하락 없이 유지된다 (≥ 85% 절대 하한).

---

### Scenario 2: tools/list 응답에 무장애 도구 추가 (REQ-KTO2-001, REQ-KTO2-002)

**Given** `MCP_TRANSPORT_MODE=stdio`, `KTO_SERVICE_KEY=<유효 키>` 환경에서 서버를 부팅하고 `BarrierFreeTourInfoModule` 이 `app.module.ts` 에 등록되어 있고,
**When** MCP 클라이언트(또는 in-process 테스트 클라이언트)가 `tools/list` JSON-RPC 요청을 전송하면,
**Then**
- 응답의 `tools` 배열에는 SPEC-KTO-001 의 15개 `kto_korean_*` 도구가 모두 포함되어 있다.
- 응답의 `tools` 배열에는 RUN Phase 에서 검증된 모든 `kto_barrier_free_*` 도구(최소 `kto_barrier_free_detailWithTour2` 포함, 최대 9개) 가 추가로 포함되어 있다.
- 각 신규 도구는 `name`, `description`, `inputSchema`(JSON Schema) 필드를 모두 포함한다.
- `description` 필드에 "무장애" 또는 "barrier-free" 의도가 명시되어 있다 (LLM 도구 선택 정확도 보장).

---

### Scenario 3: detailWithTour2 의 정상 호출 — 무장애 응답 필드 보존 (REQ-EVT-001)

**Given** 유효한 `KTO_SERVICE_KEY` 가 설정되었고 nock 이 `KorWithService2/detailWithTour2` 엔드포인트에 다음 응답을 모킹한다:

```json
{
  "response": {
    "header": { "resultCode": "0000", "resultMsg": "OK" },
    "body": {
      "items": {
        "item": [
          {
            "contentid": "126508",
            "contenttypeid": "12",
            "wheelchair": "휠체어 대여 가능",
            "exit": "주출입구 단차 없음",
            "elevator": "엘리베이터 1대 (휠체어 접근 가능)",
            "parking": "장애인 전용 2면",
            "restroom": "장애인 화장실 1층",
            "guidesystem": "점자 안내도 비치",
            "signguide": "N",
            "videoguide": "Y",
            "audioguide": "Y",
            "braileblock": "Y",
            "helpdog": "Y",
            "stroller": "Y"
          }
        ]
      },
      "numOfRows": 10,
      "pageNo": 1,
      "totalCount": 1
    }
  }
}
```

**When** MCP 클라이언트가 `tools/call` 로 `kto_barrier_free_detailWithTour2` 를 인자 `{ "contentId": "126508" }` 와 함께 호출하면,

**Then**
- HTTP 클라이언트는 `MobileOS=ETC`, `MobileApp=kto-mcp`, `_type=json`, `serviceKey=<env>` 가 자동 주입된 GET 요청을 `apis.data.go.kr/B551011/KorWithService2/detailWithTour2` 로 보낸다.
- MCP 응답은 위 1개 아이템을 포함한 정규화된 JSON 객체이며, 무장애 필드 `wheelchair`, `exit`, `elevator`, `parking`, `restroom`, `guidesystem`, `signguide`, `videoguide`, `audioguide`, `braileblock`, `helpdog`, `stroller` 가 모두 KTO 원형 표기 그대로 보존된다 (한글 번역·필드명 변경 X).
- `items.item` 이 단일 객체로 반환된 경우에도 클라이언트는 1-element 배열로 정규화한다 (기존 `normalizeItems` 로직 재사용).

---

### Scenario 4: detailWithTour2 의 contentId 누락 → 검증 실패, outbound 호출 발생 안 함 (REQ-UNW-001)

**Given** `BfDetailWithTourDto` 의 `contentId` 가 `@IsNotEmpty` 로 검증되도록 정의되어 있고,
**When** MCP 클라이언트가 `tools/call kto_barrier_free_detailWithTour2` 를 인자 `{}` (또는 `{ "contentId": "" }`) 로 호출하면,
**Then**
- 클라이언트는 nock 모킹 엔드포인트를 호출하지 않는다 (`scope.isDone() === false` 또는 outbound 카운터 0).
- MCP 응답은 검증 실패를 알리는 구조화된 에러이며, 누락된 필드명 `contentId` 가 메시지에 포함된다.
- 에러는 SPEC-KTO-001 에서 정의한 MCP 표준 도구 에러 포맷(예: `-32602` 또는 동등 구조) 을 따른다.

---

### Scenario 5: KorWithService2 5xx 응답 시 지수 백오프 재시도 (REQ-STATE-001)

**Given** nock 으로 `KorWithService2/areaBasedList2` 엔드포인트를 모킹하여 다음 시퀀스를 반환한다:
1차 호출 → HTTP 503, 2차 호출 → HTTP 503, 3차 호출 → HTTP 503, 4차 호출 → HTTP 200 (정상 응답).

**When** MCP 클라이언트가 `kto_barrier_free_areaBasedList2` 를 호출하면,

**Then**
- `KtoHttpClient` 는 총 4회 호출(최초 1회 + 재시도 3회)을 수행한다 (KorService2 와 동일 정책 — `RETRY_CONFIG` 재사용).
- 재시도 간격은 SPEC-KTO-001 Scenario 5 의 검증 로직과 동일하게 단조 증가한다 (jitter ±20% 허용).
- 4번째 응답이 200이면 MCP 도구 응답으로 반환된다.
- 모든 4회 호출이 503을 반환하면 `KtoApiError` 를 throw 하고 MCP 표준 에러 응답으로 변환된다.

추가 변형:
- 동일 시나리오에서 `KtoHttpClient.request()` 가 `service: 'KorWithService2'` 로 호출되었음을 spy/jest mock 으로 검증한다.

---

### Scenario 6: 다국어 확장 회귀 — KorService2 도구 정상 동작 보호 (REQ-OPT-001, REQ-UNW-002)

**Given** `BASE_URL_MAP` 에 `KorWithService2` 항목이 추가되어도,
**When** 기존 SPEC-KTO-001 의 Scenario 7 — `KtoHttpClient.request({ service: 'KorService2', ... })` 의 outbound URL 검증 — 을 실행하면,
**Then**
- 요청 URL 의 path 는 변경 없이 `/B551011/KorService2/{operation}` 형태이다.
- `KtoServiceName` 타입에 `KorWithService2` 가 추가되었지만 `KorService2` 호출은 영향을 받지 않는다.
- `kto_korean_*` 도구의 어떤 inputSchema·검증 로직·응답 정규화도 변경되지 않는다.

---

### Scenario 7: 게이트웨이 오류(`OpenAPI_ServiceResponse`) → MCP 표준 에러 (재사용 검증)

**Given** nock 이 `KorWithService2/detailWithTour2` 호출에 다음 XML 본문을 응답한다 (HTTP 200, Content-Type 무관):

```xml
<OpenAPI_ServiceResponse>
  <cmmMsgHeader>
    <errMsg>SERVICE ERROR</errMsg>
    <returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg>
    <returnReasonCode>30</returnReasonCode>
  </cmmMsgHeader>
</OpenAPI_ServiceResponse>
```

**When** MCP 클라이언트가 `kto_barrier_free_detailWithTour2` 를 호출하면,

**Then**
- 클라이언트는 SPEC-KTO-001 의 `parseGatewayError` 로직(변경 없음)을 통과하여 `KtoApiError`(`reasonCode='30'`, `authMsg='SERVICE_KEY_IS_NOT_REGISTERED_ERROR'`) 를 throw 한다.
- MCP 응답은 구조화된 도구 에러로 반환되며, 페이로드는 `reasonCode`, `authMsg`, `errMsg` 를 모두 포함한다.
- 에러는 재시도되지 않는다 (영구적 오류, `PERMANENT_ERROR_CODES` 재사용).

---

### Scenario 8: Streamable HTTP transport 에서 무장애 도구 정상 노출 (REQ-KTO2-002)

**Given** `MCP_TRANSPORT_MODE=streamable-http`, `MCP_HTTP_PORT=3000`, `KTO_SERVICE_KEY=<유효 키>` 환경에서 서버를 부팅하고,
**When** supertest 또는 fetch 클라이언트가 `POST http://localhost:3000/mcp` 로 `tools/list` JSON-RPC 본문을 전송하면,
**Then** HTTP 200 응답이 반환되고 본문에 Scenario 2 와 동일한 도구 셋(`kto_korean_*` + `kto_barrier_free_*`)이 포함된다.

---

### Scenario 9: 테스트 커버리지 ≥ 85% 유지 (Quality Gate)

**Given** Scenario 1~8 이 모두 PASS 이고,
**When** `pnpm test:cov` 를 실행하면,
**Then** statements / branches / functions / lines 모두 85% 이상이며, SPEC-KTO-001 시점의 95.41% 대비 유의미한 하락이 없다.

---

## 2. Edge Cases

### 2.1 빈 결과 (KorWithService2)

**Given** `KorWithService2/areaBasedList2` 응답이 `body.items === ""` (빈 문자열) 또는 `body.items.item` 부재,
**When** 도구가 호출되면,
**Then** 정규화 후 `items: []` 인 정상 응답으로 반환된다 (기존 `normalizeItems` 로직 재사용).

### 2.2 detailWithTour2 단일 객체 응답

**Given** KTO 응답이 1건 결과를 `items.item: { contentid: "..." }` (배열 아님) 으로 반환할 때,
**Then** 정규화 후 `items: [{ contentid: "..." }]` 으로 변환된다 (SPEC-KTO-001 Edge 2.4 와 동일).

### 2.3 무장애 필드 일부 누락

**Given** `detailWithTour2` 응답의 item 에 일부 무장애 필드가 누락된 경우 (예: `wheelchair` 만 있고 `elevator` 부재),
**When** 도구가 호출되면,
**Then** 응답은 누락 필드를 추가하지 않고 KTO 원형 그대로 반환한다 (필드 보강·기본값 주입 X).

### 2.4 R1 검증 — 코드 조회 도구 중복 미등록

**Given** `BARRIER_FREE_TOUR_INFO_TOOLS` 배열을 import 하고,
**When** 배열의 `name` 필드를 추출하면,
**Then** `kto_barrier_free_areaCode2`, `kto_barrier_free_categoryCode2`, `kto_barrier_free_ldongCode2`, `kto_barrier_free_lclsSystmCode2` 4개 도구는 **포함되지 않는다** (Plan R1 의 중복 도구 등록 금지 정책 검증).

### 2.5 R3 검증 — RUN Phase 에서 30/404 발생 오퍼레이션 도구 제외

**Given** RUN Phase 첫 통합 테스트에서 `kto_barrier_free_areaBasedSyncList2` 가 30 또는 404 응답을 반환했다고 가정할 때,
**When** `tools/list` 응답을 검사하면,
**Then** 해당 도구는 `BARRIER_FREE_TOUR_INFO_TOOLS` 배열에서 제거되어 등록되지 않는다.

### 2.6 한글 keyword 검색 (KorWithService2)

**Given** `searchKeyword2` 도구를 `keyword: '무장애 관광지'` 로 호출하면,
**Then** URL 인코딩이 1회만 적용되어 outbound URL 의 keyword 파라미터가 정상 인코딩 형태로 전송된다 (이중 인코딩 X, SPEC-KTO-001 Edge 2.6 정책 동일).

### 2.7 5xx → 정상 사이의 KorService2 회귀 보호

**Given** `KtoHttpClient` 의 재시도 로직이 동작 중일 때,
**When** `service: 'KorService2'` 와 `service: 'KorWithService2'` 를 번갈아 호출하면,
**Then** 두 호출의 재시도 정책·지연 계산은 동일하며, 한쪽 서비스의 재시도 상태가 다른 쪽에 영향을 주지 않는다 (요청 격리).

---

## 3. Performance Criteria

| 항목 | 목표 |
|------|------|
| 단일 KorWithService2 호출 평균 응답 시간 (모킹) | ≤ 50ms (SPEC-KTO-001 동일 기준) |
| stdio 모드 cold start (서버 가동 → `tools/list` 응답) | ≤ 500ms (도구 카탈로그가 ≈ 24개로 증가하여도 회귀 없음) |
| HTTP 모드 cold start | ≤ 1초 |
| 동시 5건 무장애 도구 호출 처리 | 모두 성공, 평균 응답 시간 ≤ 1.5초 |

> 단위 테스트는 모킹 환경 기준 50ms 이내. 실 KTO API 기준은 운영 가이드용.

---

## 4. Quality Gates (TRUST 5)

- **Tested**: 단위 + e2e 테스트가 모든 Acceptance Scenario 를 자동 검증. 커버리지 ≥ 85% (SPEC-KTO-001 의 95.41% 대비 유의미한 하락 금지).
- **Readable**: ESLint 무경고. 함수명·변수명은 KorWithService2 오퍼레이션 명명을 그대로 따른다.
- **Unified**: Prettier 포맷 통과. `BarrierFreeTourInfoModule` 이 `KoreanTourInfoModule` 과 동일한 등록 패턴(`tools.ts` 메타데이터 배열 + `ToolRegistry.registerAll()`) 을 사용.
- **Secured**: `KTO_SERVICE_KEY` 가 로그·에러 메시지에 절대 출력되지 않는다 (단위 테스트로 검증, SPEC-KTO-001 정책 재사용). class-validator 로 모든 신규 도구 입력 검증. `detailWithTour2` 의 `contentId` 필수 검증으로 빈 호출 차단 (REQ-UNW-001).
- **Trackable**: 커밋 메시지가 `feat(SPEC-KTO-002): ...` 형식. 모든 신규 public 메서드에 `@MX:TODO test` → 테스트 통과 시 제거. `BASE_URL_MAP` 갱신에 `@MX:SPEC: SPEC-KTO-002 REQ-OPT-001` 추가.

---

## 5. Definition of Done

본 SPEC 이 "완료" 로 선언되려면 다음을 모두 만족해야 한다:

- [ ] §1 의 9개 Acceptance Scenario 모두 자동화 테스트로 PASS
- [ ] §2 의 7개 Edge Case 모두 자동화 테스트로 PASS
- [ ] §3 의 Performance Criteria 모두 충족 (모킹 기준)
- [ ] §4 의 Quality Gates 모두 충족
- [ ] `pnpm test`, `pnpm test:cov`, `pnpm test:e2e`, `pnpm lint`, `pnpm build` 모두 무에러 통과
- [ ] SPEC-KTO-001 의 76 unit + 6 e2e 테스트가 변경 없이 모두 PASS (REQ-UNW-002 핵심 보호)
- [ ] `tools/list` 응답에 `kto_barrier_free_detailWithTour2` 가 반드시 포함되며, 모든 신규 도구의 `description` 에 "무장애" 의도 명시
- [ ] `BASE_URL_MAP` 의 `@MX:NOTE` 주석이 "language variants + functional sibling services" 의도로 갱신됨
- [ ] RUN Phase 첫 통합 테스트 결과(`[ASSUMED]` 마커 검증) 가 `progress.md` 또는 PR 설명에 기록되어 차기 SPEC 인수인계 가능

---

Version: 0.1.0
Last Updated: 2026-05-09
