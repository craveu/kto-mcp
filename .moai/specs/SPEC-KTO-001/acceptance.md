# Acceptance: SPEC-KTO-001 (KTO MCP 서버 1차 이터레이션)

본 문서는 SPEC-KTO-001의 요구사항이 만족되었음을 검증하기 위한 Given/When/Then
시나리오, 엣지 케이스, 그리고 정량 기준을 정의한다. 모든 시나리오는 자동화된
Jest 테스트(단위 또는 e2e)로 구현되어야 하며, 통과 여부가 SPEC 수용 가부의
1차 판정 기준이다.

---

## 1. Acceptance Scenarios (Given/When/Then)

### Scenario 1: stdio transport에서 모든 도구가 노출됨 (REQ-KTO-001, REQ-KTO-002)

**Given** `MCP_TRANSPORT_MODE=stdio`, `KTO_SERVICE_KEY=<유효 키>` 환경에서 서버를 부팅하고,
**When** MCP 클라이언트(또는 in-process 테스트 클라이언트)가 `tools/list` JSON-RPC 요청을 전송하면,
**Then** 응답의 `tools` 배열에는 다음 13개 이름이 모두 포함되어야 한다 (v1.1.0에서 `kto_korean_areaCode2`, `kto_korean_categoryCode2` 제거):

- `kto_korean_areaBasedList2`
- `kto_korean_areaBasedSyncList2`
- `kto_korean_detailCommon2`
- `kto_korean_detailImage2`
- `kto_korean_detailInfo2`
- `kto_korean_detailIntro2`
- `kto_korean_detailPetTour2`
- `kto_korean_ldongCode2`
- `kto_korean_lclsSystmCode2`
- `kto_korean_locationBasedList2`
- `kto_korean_searchFestival2`
- `kto_korean_searchKeyword2`
- `kto_korean_searchStay2`

각 도구는 `name`, `description`, `inputSchema`(JSON Schema 객체) 필드를 모두 포함해야 한다.

---

### Scenario 2: Streamable HTTP transport에서 동일 도구가 노출됨 (REQ-KTO-002)

**Given** `MCP_TRANSPORT_MODE=streamable-http`, `MCP_HTTP_PORT=3000`, `KTO_SERVICE_KEY=<유효 키>` 환경에서 서버를 부팅하고,
**When** supertest 또는 fetch 클라이언트가 `POST http://localhost:3000/mcp` 로 `tools/list` JSON-RPC 본문을 전송하면,
**Then** HTTP 200 응답이 반환되고 본문에 Scenario 1과 동일한 13개 도구가 포함된다.

---

### Scenario 3: `areaBasedList2` 도구의 정상 호출 (REQ-EVT-001, REQ-KTO-003)

**Given** 유효한 `KTO_SERVICE_KEY` 가 설정되었고 `nock`(또는 e2e의 실제 KTO API)이 다음 응답을 모킹한다:

```json
{
  "response": {
    "header": { "resultCode": "0000", "resultMsg": "OK" },
    "body": {
      "items": {
        "item": [
          { "contentid": "126508", "title": "경복궁", "addr1": "서울특별시 종로구", "mapx": "126.9770", "mapy": "37.5796", "contenttypeid": "12" }
        ]
      },
      "numOfRows": 10,
      "pageNo": 1,
      "totalCount": 1
    }
  }
}
```

**When** MCP 클라이언트가 `tools/call` 로 `kto_korean_areaBasedList2`를 인자 `{ "areaCode": 1, "numOfRows": 10, "pageNo": 1 }` 와 함께 호출하면,

**Then**
- HTTP 클라이언트는 `MobileOS=ETC`, `MobileApp=kto-mcp`, `_type=json`, `serviceKey=<env>` 가 자동 주입된 GET 요청을 `KorService2/areaBasedList2`로 보낸다.
- MCP 응답의 `content` 또는 결과 페이로드는 위 1개 아이템을 포함한 정규화된 JSON 객체이다.
- `items.item` 이 단일 객체로 반환된 경우에도 클라이언트는 1-element 배열로 정규화한다.

---

### Scenario 4: `KTO_SERVICE_KEY` 누락 시 부트스트랩 즉시 실패 (REQ-UNW-001)

**Given** `KTO_SERVICE_KEY` 환경변수가 정의되어 있지 않거나 빈 문자열이고,
**When** `node dist/main` 을 실행하면,
**Then**
- 프로세스는 0이 아닌 종료 코드(예: 1)로 종료된다.
- stderr 에 `KTO_SERVICE_KEY` 라는 변수 이름과 누락 사실을 포함한 명시적 메시지가 출력된다.
- 어떤 transport 도 active 상태로 진입하지 않는다 (포트 미바인딩, stdin 미점유).

---

### Scenario 5: KTO API 5xx 응답 시 지수 백오프 재시도 (REQ-STATE-001)

**Given** nock 으로 KTO `KorService2/areaBasedList2` 엔드포인트를 모킹하여 다음 시퀀스를 반환:
1차 호출 → HTTP 503, 2차 호출 → HTTP 503, 3차 호출 → HTTP 503, 4차 호출 → HTTP 200 (정상 응답).

**When** MCP 클라이언트가 `kto_korean_areaBasedList2` 를 호출하면,

**Then**
- 클라이언트는 총 4회 호출(최초 1회 + 재시도 3회)을 수행한다.
- 재시도 간격은 base 500ms × 2^n (jitter ±20% 허용) 으로, n=0/1/2 차수에 대해 단조 증가한다.
- 4번째 응답이 200이면 MCP 도구 응답으로 반환된다.

추가 변형:
- 모든 4회 호출이 503을 반환하면, 클라이언트는 마지막 시도 종료 후 `KtoApiError` 를 throw 하고 MCP 표준 에러 응답으로 변환한다.

---

### Scenario 6: 게이트웨이 오류(`OpenAPI_ServiceResponse`) → MCP 표준 에러 (REQ-UNW-002, REQ-KTO-004)

**Given** nock 이 다음 XML 본문을 응답한다 (HTTP 200, Content-Type 무관):

```xml
<OpenAPI_ServiceResponse>
  <cmmMsgHeader>
    <errMsg>SERVICE ERROR</errMsg>
    <returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg>
    <returnReasonCode>30</returnReasonCode>
  </cmmMsgHeader>
</OpenAPI_ServiceResponse>
```

**When** MCP 클라이언트가 임의의 KTO 도구를 호출하면,

**Then**
- 클라이언트는 fast-xml-parser 로 XML을 파싱하여 `KtoApiError`(`reasonCode='30'`, `authMsg='SERVICE_KEY_IS_NOT_REGISTERED_ERROR'`) 를 throw 한다.
- MCP 응답은 성공이 아니라 구조화된 도구 에러로 반환되며, 페이로드는 `reasonCode`, `authMsg`, `errMsg` 를 모두 포함한다.
- 에러는 재시도되지 않는다 (영구적 오류).

---

### Scenario 7: 다국어 확장성 — `serviceName` 파라미터로 base URL 결정 (REQ-OPT-001)

**Given** `KtoHttpClient.request()` 가 `serviceName: 'KorService2'` 인자로 호출되었고,
**When** axios outbound 호출을 가로채면,
**Then** 요청 URL의 path는 `/B551011/KorService2/{operation}` 형태이다.

추가 변형(설계 검증):
- `serviceName: 'EngService2'` 로 호출 시 path가 `/B551011/EngService2/{operation}` 으로 변경되어야 한다(이번 이터레이션에서는 단위 테스트로만 검증, 실제 도구 등록 X).

---

### Scenario 8: DTO 검증 실패 시 HTTP 호출 발생 안 함 (REQ-KTO-005)

**Given** `kto_korean_locationBasedList2` 도구가 `mapX`(longitude), `mapY`(latitude), `radius` 를 필수로 요구하고,
**When** MCP 클라이언트가 `mapX` 누락 상태로 도구를 호출하면,
**Then**
- 클라이언트는 nock 모킹 엔드포인트를 호출하지 않는다 (`scope.isDone() === false` 또는 outbound 카운터 0).
- MCP 응답은 검증 실패를 알리는 구조화된 에러이며, 누락된 필드명 `mapX` 가 메시지에 포함된다.

---

### Scenario 9: Graceful shutdown (REQ-EVT-002)

**Given** stdio 모드 또는 HTTP 모드로 서버가 가동 중이고 in-flight tool invocation이 1건 존재할 때,
**When** 프로세스에 `SIGTERM` 을 전송하면,
**Then**
- 서버는 새 요청 수락을 중단한다.
- in-flight 호출의 응답이 클라이언트에 전달된 후 (또는 5초 타임아웃 도달 시) transport 가 닫힌다.
- 프로세스는 종료 코드 0으로 종료된다.

---

### Scenario 10: 테스트 커버리지 ≥ 85%

**Given** 모든 위 시나리오가 PASS이고,
**When** `pnpm test:cov` 를 실행하면,
**Then** statements / branches / functions / lines 모두 85% 이상이다.

---

## 2. Edge Cases

### 2.1 빈 결과

**Given** KTO 응답이 `body.items === ""` (빈 문자열) 또는 `body.items.item` 부재,
**When** 도구가 호출되면,
**Then** 정규화 후 `items: []` 인 정상 응답으로 반환된다 (에러 X).

### 2.2 `numOfRows: 0`

**Given** MCP 클라이언트가 `numOfRows: 0` 으로 도구를 호출하면,
**Then** DTO 검증 단계에서 거절된다 (`@Min(1)` 또는 동등 규칙). 검증 실패 에러로 응답.

### 2.3 잘못된 `areaCode`

**Given** 존재하지 않는 areaCode (예: 999) 로 호출하고 KTO API가 정상 형식이지만 `totalCount: 0` 을 반환할 때,
**Then** 도구는 빈 배열을 정상 응답으로 반환한다 (Scenario 2.1과 동일 처리).

### 2.4 단일 객체 응답

**Given** KTO 응답이 1건 결과를 `items.item: { contentid: "..." }` (배열 아님) 으로 반환할 때,
**Then** 정규화 후 `items: [{ contentid: "..." }]` 으로 변환된다.

### 2.5 단일 호출 timeout

**Given** axios timeout이 발생할 때,
**Then** 5xx 와 동일하게 재시도 정책이 적용된다 (REQ-STATE-001).

### 2.6 한글 keyword 검색

**Given** `searchKeyword2` 도구를 `keyword: '경복궁'` 으로 호출하면,
**Then** URL 인코딩이 1회만 적용되어 outbound URL은 `keyword=%EA%B2%BD%EB%B3%B5%EA%B6%81` 와 동등하다 (이중 인코딩 X).

### 2.7 `_type=json` 미지정 응답 (안전망)

**Given** 클라이언트가 자동으로 `_type=json` 을 주입하더라도, 서버가 XML로 응답하는 경우(가능성 낮음),
**Then** 클라이언트는 명시적 에러로 분류하고 `KtoApiError(reason='UNEXPECTED_XML_RESPONSE')` 를 throw 한다.

---

## 3. Performance Criteria

| 항목 | 목표 |
|------|------|
| 단일 KTO API 호출 평균 응답 시간 | ≤ 1초 (네트워크 대기 제외 서버 측 처리 100ms 이내) |
| 정상 부하 시 메모리 사용량 | ≤ 256MB (RSS) |
| stdio 모드 cold start (서버 가동 → `tools/list` 응답) | ≤ 500ms |
| HTTP 모드 cold start | ≤ 1초 |
| 동시 5건 도구 호출 처리 | 모두 성공, 평균 응답 시간 ≤ 1.5초 |

> 단위 테스트에서는 모킹 환경 기준 50ms 이내 처리. e2e (실제 KTO API) 기준은 운영 가이드용.

---

## 4. Quality Gates (TRUST 5)

- **Tested**: 단위 + e2e 테스트가 모든 Acceptance Scenario 를 자동 검증. 커버리지 ≥ 85%.
- **Readable**: ESLint 무경고. 함수명·변수명은 KTO 오퍼레이션 명명을 그대로 따른다.
- **Unified**: Prettier 포맷 통과. 모든 도구가 동일 등록 패턴(`korean-tour-info.tools.ts`) 을 사용.
- **Secured**: `KTO_SERVICE_KEY` 가 로그·에러 메시지에 절대 출력되지 않는다 (단위 테스트로 검증). class-validator 로 모든 입력 검증.
- **Trackable**: 커밋 메시지가 `feat(SPEC-KTO-001): ...` 형식. 모든 신규 public 함수에 MX 태그 부여.

---

## 5. Definition of Done

본 SPEC이 "완료"로 선언되려면 다음을 모두 만족해야 한다:

- [ ] §1의 10개 Acceptance Scenario 모두 자동화 테스트로 PASS
- [ ] §2의 7개 Edge Case 모두 자동화 테스트로 PASS
- [ ] §3의 Performance Criteria 모두 충족 (모킹 기준)
- [ ] §4의 Quality Gates 모두 충족
- [ ] `pnpm test`, `pnpm test:cov`, `pnpm test:e2e`, `pnpm lint`, `pnpm build` 모두 무에러 통과
- [ ] `.env.example` 이 존재하고 README 또는 별도 가이드에서 환경변수 사용법이 안내됨
- [ ] `KTO_SERVICE_KEY` 가 어떤 산출물에도 하드코딩되지 않았음 (Grep 검사 통과)
- [ ] 차기 이터레이션 인수인계 노트(다국어 확장 지점, `BASE_URL_MAP` 위치)가 `plan.md` 또는 README 에 명시됨

---

Version: 0.1.0
Last Updated: 2026-05-09
