# Acceptance: SPEC-KTO-004 (KTO MCP 서버 4차 이터레이션 — 고캠핑 정보조회)

본 문서는 SPEC-KTO-004 의 요구사항이 만족되었음을 검증하기 위한 Given/When/Then
시나리오, 엣지 케이스, 그리고 정량 기준을 정의한다. 모든 시나리오는 자동화된 Jest
테스트(단위 또는 e2e)로 구현되어야 하며, 통과 여부가 SPEC 수용 가부의 1차 판정 기준
이다.

본 SPEC 의 핵심 보호 대상은 **SPEC-KTO-001 + SPEC-KTO-002 + SPEC-KTO-003 회귀
무사고** 이다. 따라서 acceptance 시나리오는 (1) GoCamping 신규 동작 검증과 (2)
선행 3 SPEC 회귀 검증을 양 축으로 구성한다.

---

## 1. Acceptance Scenarios (Given/When/Then)

### Scenario 1: BASE_URL_MAP refactor 후 선행 3 SPEC 회귀 무사고 (REQ-UNW-002)

**Given** `src/kto/common/constants.ts` 의 `BASE_URL_MAP` 에 `GoCamping` 항목 1줄이
추가되고 `@MX:NOTE` prose 1줄이 보강(3 패턴 명시) 되며 `@MX:SPEC` 라인에
`SPEC-KTO-004 REQ-OPT-001` 만 추가된 상태에서,

**When** `pnpm test`, `pnpm test:cov`, `pnpm test:e2e` 를 실행하면,

**Then**

- SPEC-KTO-001 시점의 unit 테스트(170여 건) 가 **모두 PASS** 한다.
- SPEC-KTO-002 시점의 unit 테스트(barrier-free 모듈) 가 **모두 PASS** 한다.
- SPEC-KTO-003 시점의 unit 테스트(photo-gallery 모듈) 가 **모두 PASS** 한다.
- 기존 e2e 테스트는 **도구 카운트 assertion (29 → 34) 을 제외한 어떤 assertion 도
  수정되지 않은 채 모두 PASS** 한다 (Grep `git diff` 로 검증 가능).
- statements 커버리지가 SPEC-KTO-003 시점 대비 유의미한 하락 없이 유지된다 (≥ 85%
  절대 하한).

---

### Scenario 2: tools/list 응답에 캠핑 도구 추가 + 도구 카운트 갱신 (REQ-KTO4-001, REQ-KTO4-002)

**Given** `MCP_TRANSPORT_MODE=stdio`, `KTO_SERVICE_KEY=<유효 키>` 환경에서 서버를
부팅하고 `GoCampingModule` 이 `app.module.ts` 에 등록되어 있고 `main.ts` 의
`registerAll()` 호출 registries 배열에 `GO_CAMPING_TOOLS` 항목이 포함되어 있고,

**When** MCP 클라이언트(또는 in-process 테스트 클라이언트)가 `tools/list` JSON-RPC
요청을 전송하면,

**Then**

- 응답의 `tools` 배열에는 SPEC-KTO-001 의 15개 `kto_korean_*` 도구가 모두 포함되어
  있다.
- 응답의 `tools` 배열에는 SPEC-KTO-002 의 10개 `kto_barrier_free_*` 도구가 모두
  포함되어 있다.
- 응답의 `tools` 배열에는 SPEC-KTO-003 의 4개 `kto_photo_*` 도구가 모두 포함되어
  있다.
- 응답의 `tools` 배열에는 5개 `kto_camping_*` 도구(`kto_camping_basedList`,
  `kto_camping_basedSyncList`, `kto_camping_locationBasedList`,
  `kto_camping_searchList`, `kto_camping_imageList`) 가 모두 포함되어 있다.
- 전체 도구 카운트는 정확히 **34** 이며, e2e 테스트의 도구 카운트 assertion 이
  `29` 에서 `34` 로 갱신되어 있다.
- 각 신규 도구는 `name`, `description`, `inputSchema`(JSON Schema) 필드를 모두
  포함한다.
- `description` 필드에 "고캠핑" / "캠핑장" / "야영장" 의도가 명시되어 있다 (LLM
  도구 선택 정확도 보장).
- `kto_camping_basedList` description 에 "운영 중 캠핑장만" 과 같은 차이가 명시되어
  있고, `kto_camping_basedSyncList` description 에 "삭제·수정·신규 이력 포함
  (`syncStatus`: A/U/D)" 의도가 명시되어 있다 (R8 완화).

---

### Scenario 3: basedList 정상 호출 — 캠핑장 메타 필드 보존 (REQ-EVT-001, REQ-KTO4-003)

**Given** 유효한 `KTO_SERVICE_KEY` 가 설정되었고 nock 이
`GoCamping/basedList` 엔드포인트에 다음 응답을 모킹한다:

```json
{
  "response": {
    "header": { "resultCode": "0000", "resultMsg": "OK" },
    "body": {
      "items": {
        "item": [
          {
            "contentId": "100001",
            "facltNm": "금방아 민박 캠핑장",
            "lineIntro": "강원도 평창의 가족 캠핑장",
            "intro": "산속에 위치한 조용한 캠핑장으로...",
            "induty": "야영장업",
            "lctCl": "산",
            "facltDivNm": "민간",
            "mangeDivNm": "직영",
            "manageSttus": "운영",
            "addr1": "강원도 평창군 ...",
            "mapX": "128.5500000",
            "mapY": "37.5500000",
            "tel": "033-000-0000",
            "homepage": "http://example.com",
            "firstImageUrl": "http://tong.visitkorea.or.kr/cms/...jpg",
            "glampSiteCo": "5",
            "caravSiteCo": "10",
            "siteBottomCl1": "Y",
            "insrncAt": "Y",
            "createdtime": "20200101000000",
            "modifiedtime": "20231115203000"
          }
        ]
      },
      "numOfRows": 10,
      "pageNo": 1,
      "totalCount": 3067
    }
  }
}
```

**When** MCP 클라이언트가 `tools/call` 로 `kto_camping_basedList` 를 인자
`{ "numOfRows": 10, "pageNo": 1 }` 와 함께 호출하면,

**Then**

- HTTP 클라이언트는 `MobileOS=ETC`, `MobileApp=kto-mcp`, `_type=json`,
  `serviceKey=<env>` 가 자동 주입된 GET 요청을
  `apis.data.go.kr/B551011/GoCamping/basedList` 로 보낸다.
- MCP 응답은 위 1개 아이템을 포함한 정규화된 JSON 객체이며, KTO 원형 필드
  (`contentId`, `facltNm`, `lineIntro`, `intro`, `induty`, `lctCl`, `facltDivNm`,
  `mangeDivNm`, `manageSttus`, `addr1`, `mapX`, `mapY`, `tel`, `homepage`,
  `firstImageUrl`, `glampSiteCo`, `caravSiteCo`, `siteBottomCl1`, `insrncAt`,
  `createdtime`, `modifiedtime`) 가 모두 KTO 원형 표기 그대로 보존된다 (한글 번역·
  필드명 변경·`Y`/`N` → boolean 변환·`firstimage` 등 다른 KTO 서비스 필드명으로의
  매핑 X).
- 응답 타입이 TypeScript 컴파일 타임에 `KtoListResponse<GoCampingItem>` 으로
  추론된다 (단위 테스트 type-check 로 검증).
- `numOfRows`, `pageNo`, `totalCount` (= 3067) 페이지네이션 필드가 응답에 그대로
  포함된다.

---

### Scenario 4: locationBasedList 의 mapX/mapY/radius 누락 → 검증 실패, outbound 호출 발생 안 함 (REQ-UNW-001)

**Given** `GcLocationBasedListDto` 의 `mapX`, `mapY`, `radius` 가 각각 `@IsNotEmpty`
로 검증되도록 정의되어 있고 `radius` 는 추가로 `@Max(20000)` 검증을 갖고 있고,

**When** MCP 클라이언트가 `tools/call kto_camping_locationBasedList` 를 다음 인자로
호출하면:

(a) `{}` (모든 필드 누락)
(b) `{ "mapX": 128.5, "mapY": 37.5 }` (radius 누락)
(c) `{ "mapX": 128.5, "mapY": 37.5, "radius": 30000 }` (radius 한도 초과)

**Then** (모든 경우에 대해)

- 클라이언트는 nock 모킹 엔드포인트를 호출하지 않는다 (`scope.isDone() === false`
  또는 outbound 카운터 0).
- MCP 응답은 검증 실패를 알리는 구조화된 에러이며:
  - (a) 의 경우 누락된 필드명 `mapX`, `mapY`, `radius` 가 모두 메시지에 포함된다.
  - (b) 의 경우 누락된 필드명 `radius` 가 메시지에 포함된다.
  - (c) 의 경우 radius 가 20000 을 초과한다는 의미의 메시지를 포함한다.
- 에러는 SPEC-KTO-001 / SPEC-KTO-002 / SPEC-KTO-003 에서 정의한 MCP 표준 도구 에러
  포맷(예: `-32602` 또는 동등 구조) 을 따른다.

---

### Scenario 5: searchList 의 keyword 누락 → 검증 실패 (REQ-UNW-001)

**Given** `GcSearchListDto` 의 `keyword` 가 `@IsString` + `@IsNotEmpty` 로 검증되고,

**When** MCP 클라이언트가 `tools/call kto_camping_searchList` 를 인자 `{}` (또는
`{ "keyword": "" }`) 로 호출하면,

**Then**

- outbound HTTP 호출 발생 안 함 (nock outbound 카운터 0).
- MCP 응답은 누락된 `keyword` 필드명을 포함한 구조화된 검증 에러.

---

### Scenario 6: imageList 의 contentId 누락 → 검증 실패 (REQ-UNW-001)

**Given** `GcImageListDto` 의 `contentId` 가 `@IsString` + `@IsNotEmpty` 로 검증되고,

**When** MCP 클라이언트가 `tools/call kto_camping_imageList` 를 인자 `{}` (또는
`{ "contentId": "" }`) 로 호출하면,

**Then**

- outbound HTTP 호출 발생 안 함.
- MCP 응답은 누락된 `contentId` 필드명을 포함한 구조화된 검증 에러.

---

### Scenario 7: imageList 빈 결과(`items: ""`) 정규화 (REQ-EVT-001, REQ-KTO4-002)

**Given** nock 이 `GoCamping/imageList` 엔드포인트에 다음 응답을 모킹한다 (사진이
없는 contentId):

```json
{
  "response": {
    "header": { "resultCode": "0000", "resultMsg": "OK" },
    "body": {
      "items": "",
      "numOfRows": 10,
      "pageNo": 1,
      "totalCount": 0
    }
  }
}
```

**When** MCP 클라이언트가 `tools/call kto_camping_imageList` 를 인자
`{ "contentId": "100001" }` 로 호출하면,

**Then**

- HTTP 호출은 정상 200 응답을 받는다.
- 기존 `normalizeItems()` 가 `body.items === ""` (빈 문자열) 을 빈 배열로 변환한다.
- MCP 응답은 `items: []` (빈 배열) 을 포함한 정상 응답이다 (에러 throw 없음).
- 페이지네이션 필드 `numOfRows: 10`, `pageNo: 1`, `totalCount: 0` 이 응답에 보존된다.
- 응답 타입이 `KtoListResponse<GoCampingImageItem>` 로 추론된다 (단위 테스트 type-check).

---

### Scenario 8: locationBasedList 정상 호출 — outbound URL 검증 + 응답 정규화 (REQ-EVT-001)

**Given** nock 이 `GoCamping/locationBasedList` 엔드포인트에 정상 응답을 모킹하고,

**When** MCP 클라이언트가 `tools/call kto_camping_locationBasedList` 를 인자
`{ "mapX": 128.5500000, "mapY": 37.5500000, "radius": 5000, "numOfRows": 10 }` 로
호출하면,

**Then**

- outbound URL 의 query string 에 `mapX=128.5500000`, `mapY=37.5500000`,
  `radius=5000` 이 포함된다 (number 입력이 axios 에 의해 string 으로 직렬화됨).
- 공통 파라미터(`MobileOS=ETC`, `MobileApp=kto-mcp`, `_type=json`, `serviceKey`) 가
  자동 주입된다.
- 응답 item 의 `contentId`, `facltNm`, `mapX`, `mapY` 등 필드가 KTO 원형 그대로 보존
  된다.

---

### Scenario 9: GoCamping 5xx 응답 시 지수 백오프 재시도 (REQ-STATE-001)

**Given** nock 으로 `GoCamping/basedList` 엔드포인트를 모킹하여 다음 시퀀스를
반환한다:
1차 호출 → HTTP 503, 2차 호출 → HTTP 503, 3차 호출 → HTTP 503, 4차 호출 → HTTP 200
(정상 응답).

**When** MCP 클라이언트가 `kto_camping_basedList` 를 호출하면,

**Then**

- `KtoHttpClient` 는 총 4회 호출(최초 1회 + 재시도 3회)을 수행한다 (선행 3 SPEC 와
  동일 정책 — `RETRY_CONFIG` 재사용).
- 재시도 간격은 단조 증가한다 (jitter ±20% 허용).
- 4번째 응답이 200이면 MCP 도구 응답으로 반환된다.
- 모든 4회 호출이 503을 반환하면 `KtoApiError` 를 throw 하고 MCP 표준 에러 응답으로
  변환된다.

추가 변형:

- 동일 시나리오에서 `KtoHttpClient.request()` 가 `service: 'GoCamping'` 로 호출
  되었음을 spy/jest mock 으로 검증한다.

---

### Scenario 10: 선행 SPEC 회귀 — 3 도구 셋 정상 동작 보호 (REQ-OPT-001, REQ-UNW-002)

**Given** `BASE_URL_MAP` 에 `GoCamping` 항목이 추가되고 `@MX:NOTE` prose 가 1줄
보강되어도,

**When** 기존 SPEC-KTO-001 의 KorService2 outbound URL 검증 시나리오, SPEC-KTO-002
의 KorWithService2 outbound URL 검증 시나리오, SPEC-KTO-003 의 PhotoGalleryService1
outbound URL 검증 시나리오를 모두 실행하면,

**Then**

- KorService2 요청 URL 의 path 는 변경 없이 `/B551011/KorService2/{operation}` 형태이다.
- KorWithService2 요청 URL 의 path 는 변경 없이 `/B551011/KorWithService2/{operation}` 형태이다.
- PhotoGalleryService1 요청 URL 의 path 는 변경 없이 `/B551011/PhotoGalleryService1/{operation}` 형태이다.
- `KtoServiceName` 타입에 `GoCamping` 가 추가되었지만 선행 3 서비스 호출은 영향을
  받지 않는다.
- `kto_korean_*` / `kto_barrier_free_*` / `kto_photo_*` 도구의 어떤 inputSchema·검증
  로직·응답 정규화도 변경되지 않는다.

---

### Scenario 11: 게이트웨이 오류(`OpenAPI_ServiceResponse`) → MCP 표준 에러 (재사용 검증)

**Given** nock 이 `GoCamping/searchList` 호출에 다음 XML 본문을 응답한다 (HTTP 200,
Content-Type 무관):

```xml
<OpenAPI_ServiceResponse>
  <cmmMsgHeader>
    <errMsg>SERVICE ERROR</errMsg>
    <returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg>
    <returnReasonCode>30</returnReasonCode>
  </cmmMsgHeader>
</OpenAPI_ServiceResponse>
```

**When** MCP 클라이언트가 `kto_camping_searchList` 를 인자 `{ "keyword": "야영장" }`
로 호출하면,

**Then**

- 클라이언트는 SPEC-KTO-001 의 `parseGatewayError` 로직(변경 없음)을 통과하여
  `KtoApiError`(`reasonCode='30'`, `authMsg='SERVICE_KEY_IS_NOT_REGISTERED_ERROR'`)
  를 throw 한다.
- MCP 응답은 구조화된 도구 에러로 반환되며, 페이로드는 `reasonCode`, `authMsg`,
  `errMsg` 를 모두 포함한다.
- 에러는 재시도되지 않는다 (영구적 오류, `PERMANENT_ERROR_CODES` 재사용).

---

### Scenario 12: Streamable HTTP transport 에서 캠핑 도구 정상 노출 (REQ-KTO4-002)

**Given** `MCP_TRANSPORT_MODE=streamable-http`, `MCP_HTTP_PORT=3000`,
`KTO_SERVICE_KEY=<유효 키>` 환경에서 서버를 부팅하고,

**When** supertest 또는 fetch 클라이언트가 `POST http://localhost:3000/mcp` 로
`tools/list` JSON-RPC 본문을 전송하면,

**Then** HTTP 200 응답이 반환되고 본문에 Scenario 2 와 동일한 도구 셋(`kto_korean_*`
+ `kto_barrier_free_*` + `kto_photo_*` + `kto_camping_*`, 총 34개) 이 포함된다.

---

### Scenario 13: 테스트 커버리지 ≥ 85% 유지 (Quality Gate)

**Given** Scenario 1~12 가 모두 PASS 이고,

**When** `pnpm test:cov` 를 실행하면,

**Then** statements / branches / functions / lines 모두 85% 이상이며, SPEC-KTO-003
시점 대비 유의미한 하락이 없다.

---

### Scenario 14: GoCampingItem / GoCampingImageItem typed item 노출 (REQ-KTO4-003)

**Given** `src/kto/go-camping/types.ts` 에 `GoCampingItem` interface 와
`GoCampingImageItem` interface 가 정의되어 있고,

**When** TypeScript 컴파일러로 `GoCampingService` 의 5 메서드 반환 타입을 추론하면,

**Then**

- `basedList`, `basedSyncList`, `locationBasedList`, `searchList` 의 반환 타입이
  `Promise<KtoListResponse<GoCampingItem>>` 으로 정확히 추론된다.
- `imageList` 의 반환 타입이 `Promise<KtoListResponse<GoCampingImageItem>>` 으로
  정확히 추론된다.
- `GoCampingItem.contentId` 가 `string` 타입의 required 필드로 정의되어 있다.
- `GoCampingItem` 의 핵심 30 필드 (`facltNm`, `lineIntro`, `intro`, `addr1`,
  `addr2`, `mapX`, `mapY`, `induty`, `lctCl`, ..., `firstImageUrl`,
  `createdtime`, `modifiedtime`, `syncStatus`, ...) 가 모두 optional `string` 으로
  정의되어 있다.
- `GoCampingItem` 에 인덱스 시그니처 `[key: string]: string | undefined` 가
  정의되어 있어, Swagger 명세에 등장하는 30+ 추가 필드 (`siteMg1Co`, `glampInnerFclty`,
  `frprvtSandCo`, `themaEnvrnCl` 등) 가 자동 흡수된다.
- `GoCampingImageItem.contentId` 가 `string` 타입의 required 필드로 정의되어 있고,
  `serialnum`, `imageUrl`, `createdtime`, `modifiedtime` 이 optional `string` 으로
  정의되어 있다.
- 단위 테스트에서 두 interface 를 import 하여 mock 응답 데이터를 타입 체크할 수
  있다.

---

### Scenario 15: basedSyncList 호출 — syncStatus 필드 보존 (REQ-EVT-001)

**Given** nock 이 `GoCamping/basedSyncList` 엔드포인트에 다음 응답을 모킹한다:

```json
{
  "response": {
    "header": { "resultCode": "0000", "resultMsg": "OK" },
    "body": {
      "items": {
        "item": [
          { "contentId": "100001", "facltNm": "캠핑장 A", "syncStatus": "A" },
          { "contentId": "100002", "facltNm": "캠핑장 B", "syncStatus": "U" },
          { "contentId": "100003", "facltNm": "캠핑장 C", "syncStatus": "D" }
        ]
      },
      "numOfRows": 100,
      "pageNo": 1,
      "totalCount": 5181
    }
  }
}
```

**When** MCP 클라이언트가 `tools/call kto_camping_basedSyncList` 를 인자
`{ "numOfRows": 100, "pageNo": 1 }` 로 호출하면,

**Then**

- 응답 3 아이템의 `syncStatus` 필드가 모두 KTO 원형 (`A`, `U`, `D`) 그대로 보존
  된다 (boolean 또는 enum 변환 X).
- `totalCount: 5181` 이 응답에 그대로 포함된다 (R8 검증 — `basedList` totalCount
  3067 보다 큼).

---

## 2. Edge Cases

### 2.1 빈 결과 (모든 GoCamping 오퍼레이션)

**Given** `GoCamping/{operation}` 응답이 `body.items === ""` (빈 문자열) 또는
`body.items.item` 부재 (모든 5 오퍼레이션 어디든),

**When** 도구가 호출되면,

**Then** 정규화 후 `items: []` 인 정상 응답으로 반환된다 (기존 `normalizeItems` 로직
재사용).

### 2.2 단일 객체 응답 → 배열 정규화

**Given** KTO 응답이 1건 결과를 `items.item: { contentId: "...", facltNm: "..." }`
(배열 아님) 으로 반환할 때,

**Then** 정규화 후 `items: [{ contentId: "...", facltNm: "..." }]` 으로 변환된다
(SPEC-KTO-001 Edge 와 동일한 단일 객체 → 배열 정규화 로직 재사용).

### 2.3 응답 필드 일부 누락 — 인덱스 시그니처 검증

**Given** `basedList` 응답의 item 에 일부 필드가 누락된 경우 (예: `induty` 만 있고
`facltNm`, `addr1` 부재),

**When** 도구가 호출되면,

**Then** 응답은 누락 필드를 추가하지 않고 KTO 원형 그대로 반환한다 (필드 보강·기본값
주입 X). `GoCampingItem` interface 의 optional named 필드 + 인덱스 시그니처 정의로
TypeScript 컴파일 무에러.

### 2.4 인덱스 시그니처로 흡수되는 캠핑 특화 필드 검증

**Given** `basedList` 응답의 item 이 named 필드 외 추가 필드 (`siteMg1Co: "10"`,
`glampInnerFclty: "냉장고,에어컨"`, `frprvtSandCo: "5"`, `themaEnvrnCl: "산"`) 를
포함할 때,

**When** 도구가 호출되면,

**Then** 응답에 해당 추가 필드들이 KTO 원형 그대로 보존되고, `GoCampingItem` 의
인덱스 시그니처 (`[key: string]: string | undefined`) 로 type 체크 통과 (단위 테스트
컴파일 검증).

### 2.5 한글 keyword 검색 (searchList)

**Given** `kto_camping_searchList` 도구를 `keyword: '야영장 강원도'` 로 호출하면,

**Then** URL 인코딩이 1회만 적용되어 outbound URL 의 `keyword` 파라미터가 정상
인코딩 형태로 전송된다 (이중 인코딩 X, 선행 SPEC 정책 동일).

### 2.6 `radius` 경계값 검증 (locationBasedList)

**Given** `kto_camping_locationBasedList` 의 `radius` 입력값이 다음 경계값일 때:

(a) `radius: 1` (최소)
(b) `radius: 20000` (최대 정확히)
(c) `radius: 20001` (최대 초과)
(d) `radius: 0` (zero)
(e) `radius: -100` (음수)

**Then**

- (a) 와 (b) 는 검증 통과 → outbound 발생.
- (c) 와 (e) 는 검증 실패 → outbound 0회 + MCP 검증 에러 (`@Max(20000)` 또는
  `@IsPositive` 에 의해).
- (d) 의 처리는 `@IsNotEmpty` 또는 `@IsPositive` 정책에 따라 결정 (Plan §1.7 에서
  결정).

### 2.7 5xx → 정상 사이의 선행 3 SPEC 회귀 보호

**Given** `KtoHttpClient` 의 재시도 로직이 동작 중일 때,

**When** `service: 'KorService2'`, `service: 'KorWithService2'`, `service:
'PhotoGalleryService1'`, `service: 'GoCamping'` 를 번갈아 호출하면,

**Then** 4 호출의 재시도 정책·지연 계산은 동일하며, 한쪽 서비스의 재시도 상태가 다른
쪽에 영향을 주지 않는다 (요청 격리).

### 2.8 R6 검증 — `contentId` 별도 ID 체계 (GoCamping vs KorService2)

**Given** 사용자가 KorService2 의 `contentid="126508"` 을 `kto_camping_imageList`
도구에 `contentId: "126508"` 로 입력하고,

**When** nock 이 `body.items === ""` (빈 응답) 으로 모킹할 때,

**Then** 도구는 정상적으로 빈 응답을 반환한다 (에러 throw 없음). 도구 description
에 "캠핑장 ID 는 KorService2 contentid 와 별개" 의도가 명시되어 있어 사용자가
잘못된 ID 사용을 사전 인지 가능.

### 2.9 도구 카운트 정확성 — assertion 갱신

**Given** `test/kto.e2e-spec.ts` 의 도구 카운트 assertion 이 `29` (15 + 10 + 4) 에서
`34` (15 + 10 + 4 + 5) 로 갱신된 상태,

**When** `tools/list` 응답을 받으면,

**Then** 응답의 `tools.length` 가 정확히 `34` 와 일치한다.

### 2.10 `mapX`/`mapY`/`radius` number/string 양 type 입력 정상 처리

**Given** `kto_camping_locationBasedList` 의 `mapX`, `mapY`, `radius` 입력이 다음
조합으로 들어올 때:

(a) 모두 number: `{ "mapX": 128.55, "mapY": 37.55, "radius": 5000 }`
(b) 모두 string: `{ "mapX": "128.55", "mapY": "37.55", "radius": "5000" }`
(c) 혼합: `{ "mapX": 128.55, "mapY": "37.55", "radius": 5000 }`

**Then**

- (a)/(b)/(c) 모두 검증 통과.
- outbound URL 의 query string 에 모두 string 형태 (`mapX=128.55&mapY=37.55&radius=5000`)
  로 직렬화된다.
- 단위 테스트로 axios 의 자동 string 변환 동작 검증.

### 2.11 imageList 정상 응답 — 사진 메타 보존

**Given** nock 이 `GoCamping/imageList` 에 다음 응답을 모킹할 때:

```json
{
  "response": {
    "header": { "resultCode": "0000", "resultMsg": "OK" },
    "body": {
      "items": {
        "item": [
          {
            "contentId": "100001",
            "serialnum": "1",
            "imageUrl": "http://tong.visitkorea.or.kr/cms/...jpg",
            "createdtime": "20200101000000",
            "modifiedtime": "20231115203000"
          },
          {
            "contentId": "100001",
            "serialnum": "2",
            "imageUrl": "http://tong.visitkorea.or.kr/cms/...jpg",
            "createdtime": "20200101000000",
            "modifiedtime": "20231115203000"
          }
        ]
      },
      "numOfRows": 10, "pageNo": 1, "totalCount": 2
    }
  }
}
```

**When** `kto_camping_imageList` 가 `{ "contentId": "100001" }` 로 호출되면,

**Then**

- 응답에 2 아이템 (`serialnum: "1"`, `serialnum: "2"`) 가 모두 포함된다.
- `imageUrl` 필드가 KTO 원형 그대로 보존된다 (image binary fetch X — Exclusion 1).
- 응답 타입이 `KtoListResponse<GoCampingImageItem>` 로 추론된다.

---

## 3. Performance Criteria

| 항목 | 목표 |
|------|------|
| 단일 GoCamping 호출 평균 응답 시간 (모킹) | ≤ 50ms (선행 SPEC 동일 기준) |
| stdio 모드 cold start (서버 가동 → `tools/list` 응답) | ≤ 500ms (도구 카탈로그가 34개로 증가하여도 회귀 없음) |
| HTTP 모드 cold start | ≤ 1초 |
| 동시 5건 캠핑 도구 호출 처리 | 모두 성공, 평균 응답 시간 ≤ 1.5초 |

> 단위 테스트는 모킹 환경 기준 50ms 이내. 실 KTO API 기준은 운영 가이드용.

---

## 4. Quality Gates (TRUST 5)

- **Tested**: 단위 + e2e 테스트가 모든 Acceptance Scenario 를 자동 검증. 커버리지 ≥
  85% (선행 SPEC 시점 대비 유의미한 하락 금지).
- **Readable**: ESLint 무경고. 함수명·변수명은 GoCamping 오퍼레이션 명명을 그대로
  따른다. `GoCampingItem` / `GoCampingImageItem` interface 필드명은 KTO 원형
  보존.
- **Unified**: Prettier 포맷 통과. `GoCampingModule` 이 `KoreanTourInfoModule` /
  `BarrierFreeTourInfoModule` / `PhotoGalleryModule` 과 동일한 등록 패턴(`tools.ts`
  메타데이터 배열 + `registerAll()` 의 `ToolRegistry[]` 항목 추가) 을 사용.
- **Secured**: `KTO_SERVICE_KEY` 가 로그·에러 메시지에 절대 출력되지 않는다 (단위
  테스트로 검증, SPEC-KTO-001 정책 재사용). class-validator 로 모든 신규 도구 입력
  검증. `locationBasedList` (mapX/mapY/radius), `searchList` (keyword), `imageList`
  (contentId) 의 필수 검증으로 빈 호출 차단 (REQ-UNW-001). radius `@Max(20000)`
  로 부적절한 입력 차단.
- **Trackable**: 커밋 메시지가 `feat(SPEC-KTO-004): ...` 형식. 모든 신규 public
  메서드에 `@MX:TODO test` → 테스트 통과 시 제거. `BASE_URL_MAP` 갱신에 `@MX:SPEC:
  SPEC-KTO-004 REQ-OPT-001` 추가 + prose 1줄 보강. `GoCampingItem` /
  `GoCampingImageItem` 에 `@MX:NOTE` + `@MX:SPEC: SPEC-KTO-004 REQ-KTO4-003` 추가.

---

## 5. Definition of Done

본 SPEC 이 "완료" 로 선언되려면 다음을 모두 만족해야 한다:

- [ ] §1 의 15개 Acceptance Scenario 모두 자동화 테스트로 PASS
- [ ] §2 의 11개 Edge Case 모두 자동화 테스트로 PASS
- [ ] §3 의 Performance Criteria 모두 충족 (모킹 기준)
- [ ] §4 의 Quality Gates 모두 충족
- [ ] `pnpm test`, `pnpm test:cov`, `pnpm test:e2e`, `pnpm lint`, `pnpm build` 모두
  무에러 통과
- [ ] SPEC-KTO-001 의 unit + e2e 테스트가 도구 카운트 assertion 갱신 외 변경 없이
  모두 PASS (REQ-UNW-002 핵심 보호)
- [ ] SPEC-KTO-002 의 unit + e2e 테스트가 도구 카운트 assertion 갱신 외 변경 없이
  모두 PASS (REQ-UNW-002 핵심 보호)
- [ ] SPEC-KTO-003 의 unit + e2e 테스트가 도구 카운트 assertion 갱신 외 변경 없이
  모두 PASS (REQ-UNW-002 핵심 보호)
- [ ] `tools/list` 응답에 5개 `kto_camping_*` 도구 (`kto_camping_basedList`,
  `kto_camping_basedSyncList`, `kto_camping_locationBasedList`,
  `kto_camping_searchList`, `kto_camping_imageList`) 가 모두 포함되며, 모든 신규
  도구의 `description` 에 "고캠핑" / "캠핑장" / "야영장" 의도 명시
- [ ] `src/kto/go-camping/types.ts` 에 `GoCampingItem` + `GoCampingImageItem`
  interface 두 개가 정의되고 export 되며, `GoCampingService` 의 4 list ops 반환
  타입이 `Promise<KtoListResponse<GoCampingItem>>` 이고 `imageList` 반환 타입이
  `Promise<KtoListResponse<GoCampingImageItem>>` 임 (REQ-KTO4-003)
- [ ] `BASE_URL_MAP` 의 `@MX:SPEC` 라인에 `SPEC-KTO-004 REQ-OPT-001` 가 추가됨 +
  `@MX:NOTE` prose 1줄 보강 (3 패턴 명시)
- [ ] e2e 도구 카운트 assertion 이 `29` 에서 `34` 로 정확히 갱신됨

Version: 0.1.0
Last Updated: 2026-05-09

---
