# Research: SPEC-KTO-001 (KTO MCP 서버 1차 이터레이션)

## 조사 목적

한국관광공사(KTO) 국문 관광정보 조회 API(`KorService2`, data.go.kr 공개 ID 15101578)를
NestJS 11 기반 MCP 서버로 래핑하기 위한 사전 조사. 본 문서는 외부 API의 인터페이스,
응답 포맷, 인증 방식, 다국어 확장성 그리고 `@modelcontextprotocol/sdk` 통합 패턴을 정리한다.

---

## 1. 외부 API 개요

### 1.1 발급처 및 API ID

- **발급기관**: 한국관광공사 (KTO, Korea Tourism Organization)
- **공급 플랫폼**: 공공데이터포털 (data.go.kr)
- **공개 API ID**: 15101578
- **공식 API 카탈로그 URL**: https://www.data.go.kr/data/15101578/openapi.do
- **서비스 계열 식별자**: `B551011/KorService2`

### 1.2 Base URL

```
http://apis.data.go.kr/B551011/KorService2/
```

운영 환경에서는 동일 호스트의 HTTPS 변체(`https://apis.data.go.kr/B551011/KorService2/`)도 동작하지만,
`data.go.kr` 활용 가이드는 HTTP를 기본 예시로 제시한다. 본 SPEC에서는 HTTP·HTTPS 모두 시도하고,
HTTPS 사용을 우선 정책으로 둔다(서버 측 강제 X, 클라이언트 옵션 O).

### 1.3 다국어 변체 명명 규칙

KTO는 동일한 오퍼레이션 셋을 8개 다국어로 별도 서비스로 노출한다. base path만 변경된다.

| 언어 | Service Path |
|------|--------------|
| 국문 (이번 이터레이션) | `KorService2` |
| 영문 | `EngService2` |
| 일문 | `JpnService2` |
| 중문(간체) | `ChsService2` |
| 중문(번체) | `ChtService2` |
| 독일문 | `GerService2` |
| 프랑스문 | `FreService2` |
| 스페인문 | `SpnService2` |
| 러시아문 | `RusService2` |

> 명명 규칙은 KTO 가이드 표준 패턴이며, **`KorService2` 외 변체는 차기 이터레이션에서 정식 검증 예정**.
> 본 SPEC의 HTTP 클라이언트는 `language` 또는 `serviceName` 파라미터로 base path를 결정하도록 설계한다
> (예: `serviceName: 'KorService2'` → base path 결정).

---

## 2. 인증 방식

- **방식**: 쿼리 파라미터 `serviceKey`
- **출처**: 환경변수 `KTO_SERVICE_KEY`에서 로드
- **인코딩 주의**:
  - data.go.kr는 키 발급 시 **인코딩(URL-encoded)** / **디코딩(원본)** 두 가지 형태를 동시에 제공한다.
  - 라이브러리(`axios`, `URLSearchParams`)가 자동으로 URL 인코딩하면 이중 인코딩이 일어나 401/SERVICE_KEY_NOT_REGISTERED_ERROR가 발생할 수 있다.
  - **권장**: 환경변수에 **decoded 원본 키**를 저장하고, HTTP 클라이언트가 `URLSearchParams`로 한 번만 인코딩하게 한다.
  - 만약 사용자가 encoded 키를 저장하면 옵션 플래그(`KTO_SERVICE_KEY_PREENCODED=true`) 또는 raw 문자열 결합으로 우회한다.

[ASSUMED — verify against Swagger] 위 인코딩 정책은 data.go.kr 공통 가이드를 따르나,
실제 KorService2가 이중 인코딩을 거부하는지는 통합 테스트 단계에서 확인이 필요하다.

---

## 3. 공통 요청 파라미터

모든 KorService2 오퍼레이션이 공통으로 요구하는 파라미터:

| 파라미터 | 필수 | 설명 |
|----------|------|------|
| `serviceKey` | O | data.go.kr 발급 인증 키 |
| `MobileOS` | O | 호출 OS. `ETC` / `IOS` / `AND` / `WEB` / `WIN` 중 택1. 본 서버는 기본값 `ETC` 사용 |
| `MobileApp` | O | 호출 애플리케이션 명. 본 서버는 `kto-mcp` 사용 |
| `_type` | 선택(권장) | `json` 지정 시 JSON 응답. 미지정 시 XML |
| `numOfRows` | 선택 | 한 페이지 결과 수. 기본 10. KTO 측 상한은 일반적으로 200 (오퍼레이션별 차이 가능) |
| `pageNo` | 선택 | 페이지 번호. 1-기반 |

본 SPEC은 클라이언트 레벨에서 `MobileOS=ETC`, `MobileApp=kto-mcp`, `_type=json`을 자동 주입한다.

---

## 4. 오퍼레이션 카탈로그

> 출처: data.go.kr 공개 API 카탈로그 페이지(15101578) 본문에 명시된 15종 데이터 유형 +
> KTO 표준 오퍼레이션 명명 패턴(`{operationName}2`).
>
> [ASSUMED — verify against Swagger] 각 오퍼레이션의 정확한 파라미터 셋·응답 필드는
> 공식 Swagger UI(다운로드 가이드 PDF) 검토 후 구현 단계에서 최종 확정한다.

### 4.1 코드/메타데이터 조회 오퍼레이션

| 오퍼레이션 | 한글명 | 핵심 파라미터(공통 외) | 주요 응답 필드 |
|------------|--------|------------------------|----------------|
| `areaCode2` | 지역 코드 조회 | `areaCode?` (시도 단위 미지정 시 17개 시도 반환) | `code`, `name`, `rnum` |
| `categoryCode2` | 서비스 분류 코드 조회 | `cat1?`, `cat2?`, `cat3?`, `contentTypeId?` | `code`, `name`, `rnum` |
| `ldongCode2` | 법정동 코드 조회 | `lDongRegnCd?`, `lDongSignguCd?` | `code`, `name`, `rnum` |
| `lclsSystmCode2` | 분류체계 코드 조회 | `lclsSystm1?`, `lclsSystm2?`, `lclsSystm3?` | `code`, `name`, `rnum` |

### 4.2 목록 조회 오퍼레이션

| 오퍼레이션 | 한글명 | 핵심 파라미터(공통 외) | 주요 응답 필드 |
|------------|--------|------------------------|----------------|
| `areaBasedList2` | 지역기반 관광정보 목록 | `arrange?`(정렬), `contentTypeId?`(콘텐츠 유형), `areaCode?`, `sigunguCode?`, `cat1?`, `cat2?`, `cat3?`, `modifiedtime?` | `contentid`, `contenttypeid`, `title`, `addr1`, `addr2`, `mapx`, `mapy`, `firstimage`, `firstimage2`, `tel`, `cat1`, `cat2`, `cat3`, `createdtime`, `modifiedtime` |
| `areaBasedSyncList2` | 동기화 목록 | `showflag?`(공개여부), `arrange?`, `contentTypeId?`, `areaCode?`, `modifiedtime?` | 위와 동일 + `showflag` |
| `locationBasedList2` | 위치기반 관광정보 | `mapX`, `mapY`, `radius`(미터, 최대 20000), `contentTypeId?`, `arrange?` | `dist`(중심점 거리) + 위 목록 응답 동일 |
| `searchKeyword2` | 키워드 검색 | `keyword`, `contentTypeId?`, `areaCode?`, `cat1?`, `cat2?`, `cat3?`, `arrange?` | 목록 응답 동일 |
| `searchFestival2` | 행사정보 검색 | `eventStartDate`(YYYYMMDD, 필수), `eventEndDate?`, `areaCode?`, `sigunguCode?` | 목록 응답 + `eventstartdate`, `eventenddate` |
| `searchStay2` | 숙박정보 검색 | `areaCode?`, `sigunguCode?`, `arrange?` | 목록 응답 동일(contentTypeId=32 고정) |

### 4.3 상세 조회 오퍼레이션

| 오퍼레이션 | 한글명 | 핵심 파라미터(공통 외) | 주요 응답 필드 |
|------------|--------|------------------------|----------------|
| `detailCommon2` | 공통정보 조회 | `contentId`(필수) | `contentid`, `contenttypeid`, `title`, `tel`, `homepage`, `firstimage`, `addr1`, `addr2`, `mapx`, `mapy`, `overview` |
| `detailIntro2` | 소개 정보 | `contentId`, `contentTypeId` | contentTypeId별로 필드 상이(예: 12-관광지 → `infocenter`, `restdate`, `parking`, `chkbabycarriage` 등) |
| `detailInfo2` | 반복 상세정보 | `contentId`, `contentTypeId` | 반복 행 배열(`infoname`, `infotext`, `serialnum` 등) |
| `detailImage2` | 이미지 정보 | `contentId`, `imageYN?`(`Y`/`N`) | `originimgurl`, `smallimageurl`, `serialnum`, `imgname` |
| `detailPetTour2` | 반려동물 동반 여행정보 | `contentId?`(미지정 시 전체 페이징 반환) | `acmpyTypeCd`, `acmpyPsblCpam`, `acmpyNeedMtr`, `etcAcmpyInfo` |

> [ASSUMED — verify against Swagger] `detailPetTour2`가 KorService2에 포함되는지 vs
> 별도 서비스 ID(15135102)로 분리되었는지는 Swagger 확인 시점에 재검증한다.
> 현 시점 데이터고 카탈로그 본문에는 `반려동물 동반여행정보`가 KorService2 데이터 셋에 포함되어 있다.

### 4.4 오퍼레이션 합계

본 이터레이션은 KorService2 의 **15개 오퍼레이션**을 1:1로 MCP 도구에 매핑한다.

---

## 5. 응답 포맷

특별한 명시가 없는 이상 JSON 응답을 기본으로 한다.

### 5.1 기본 XML 구조

```xml
<response>
  <header>
    <resultCode>0000</resultCode>
    <resultMsg>OK</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <contentid>...</contentid>
        ...
      </item>
    </items>
    <numOfRows>10</numOfRows>
    <pageNo>1</pageNo>
    <totalCount>123</totalCount>
  </body>
</response>
```

### 5.2 JSON 변체 (`_type=json`)

```json
{
  "response": {
    "header": { "resultCode": "0000", "resultMsg": "OK" },
    "body": {
      "items": { "item": [{ "contentid": "...", "title": "..." }] },
      "numOfRows": 10,
      "pageNo": 1,
      "totalCount": 123
    }
  }
}
```

주의 사항:
- `items`가 빈 결과일 때 빈 문자열(`""`) 또는 빈 객체로 반환될 수 있다.
- `items.item`은 결과가 1건이면 배열이 아닌 단일 객체로 반환되는 경우가 있다(공공데이터포털 표준 변환 한계).
- 클라이언트에서 항상 배열로 정규화해야 한다.

### 5.3 에러 응답 (`OpenAPI_ServiceResponse` 헤더)

KTO API는 게이트웨이 레벨 오류 시 다음 형식으로 응답한다(`_type=json` 무관, 게이트웨이가 XML로 응답):

```xml
<OpenAPI_ServiceResponse>
  <cmmMsgHeader>
    <errMsg>SERVICE ERROR</errMsg>
    <returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg>
    <returnReasonCode>30</returnReasonCode>
  </cmmMsgHeader>
</OpenAPI_ServiceResponse>
```

대표 reason code (data.go.kr 표준):

| 코드 | 메시지 | 의미 |
|------|--------|------|
| 00 | NORMAL_SERVICE | 정상 |
| 01 | APPLICATION_ERROR | 애플리케이션 에러 |
| 02 | DB_ERROR | 데이터베이스 에러 |
| 03 | NODATA_ERROR | 결과 없음 |
| 04 | HTTP_ERROR | HTTP 에러 |
| 05 | SERVICETIMEOUT_ERROR | 서비스 타임아웃 |
| 10 | INVALID_REQUEST_PARAMETER_ERROR | 잘못된 요청 파라미터 |
| 11 | NO_MANDATORY_REQUEST_PARAMETERS_ERROR | 필수 요청 파라미터 누락 |
| 12 | NO_OPENAPI_SERVICE_ERROR | 폐기된 서비스 |
| 20 | SERVICE_ACCESS_DENIED_ERROR | 서비스 접근 거부 |
| 22 | LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR | 일일 호출 한도 초과 |
| 30 | SERVICE_KEY_IS_NOT_REGISTERED_ERROR | 등록되지 않은 서비스 키 |
| 31 | DEADLINE_HAS_EXPIRED_ERROR | 활용 기간 만료 |
| 32 | UNREGISTERED_IP_ERROR | 등록되지 않은 IP |
| 99 | UNKNOWN_ERROR | 알 수 없는 에러 |

→ 클라이언트는 두 가지 응답 형태(`response` 정상 + `OpenAPI_ServiceResponse` 게이트웨이 오류)를 모두 인식하고
공통 에러 객체로 정규화해야 한다.

---

## 6. 페이지네이션 정책

- 기본 응답에는 `totalCount`, `pageNo`, `numOfRows`가 포함된다.
- MCP 도구는 입력 파라미터 `numOfRows` (기본 10, 최대 100 권장), `pageNo` (기본 1)를 노출하고 사용자에게 페이징을 위임한다.
- 본 이터레이션에서 자동 페이징(`auto-pagination`)은 구현하지 않는다(과도한 응답 크기 → MCP transport 부담).

---

## 7. 다국어 확장 설계 시 차이점

`KorService2` ↔ `EngService2` ↔ `JpnService2` ... 차이는 다음에 한정된다:

- **base path** (`KorService2` → `EngService2` 등)
- 응답 본문의 자연어 필드 (`title`, `addr1`, `overview` 등)가 해당 언어로 채워짐
- 일부 변체는 한국 외 컨텐츠도 포함될 수 있음(예: 영문 서비스에서 안내 정보가 영문으로만 제공)
- 오퍼레이션 명, 파라미터 이름, 응답 스키마는 동일

→ 본 SPEC의 클라이언트는 `serviceName: string` 파라미터(예: `'KorService2'`)를 받아 base URL을 결정한다.
DTO·도구 정의 모듈은 언어별로 따로 두되, 공용 타입은 `kto/common/`에서 재사용한다.

---

## 8. MCP 통합 측면 (`@modelcontextprotocol/sdk`)

### 8.1 패키지 및 버전

- **패키지**: `@modelcontextprotocol/sdk` (TypeScript 공식 SDK)
- **참고 저장소**: https://github.com/modelcontextprotocol/typescript-sdk
- **선정 버전 정책**: 1.x 안정 채널의 최신 마이너 (구현 시점 `pnpm view @modelcontextprotocol/sdk version`로 확인 후 핀)
  - 예시 후보: `^1.0.0` 이상의 1.x. 2.x는 pre-alpha이므로 채택하지 않는다.

### 8.2 핵심 클래스

- `McpServer`: MCP 서버 본체 (도구·리소스·프롬프트 등록)
- `StdioServerTransport`: 표준 입출력 transport
- `StreamableHTTPServerTransport`: HTTP Streamable transport (SSE 또는 청크 응답)
- 비스트리밍 HTTP는 SDK가 직접 제공하지 않으므로, NestJS HTTP 컨트롤러에서 `Server.handleRequest()` 또는
  단일 요청-응답 어댑터를 자체 구현한다.

### 8.3 도구 등록 패턴 (개념)

각 KorService2 오퍼레이션은 `McpServer.registerTool()` 호출로 도구화한다:

- 도구명: `kto_korean_{operationName}` (예: `kto_korean_areaBasedList2`)
- 입력 스키마: 오퍼레이션의 KTO 파라미터 + (공통 파라미터는 자동 주입되므로 도구 입력에서 제외)
- 출력: KTO 응답을 정규화한 JSON 문자열 또는 구조화 결과

### 8.4 Transport 매핑

| MCP transport | NestJS 결합 방식 |
|---------------|------------------|
| stdio | `main.ts`에서 `NestFactory.createApplicationContext()`로 컨테이너만 부팅 후 `StdioServerTransport` 연결 |
| Streamable HTTP | `NestFactory.create()` + Express 어댑터, MCP가 정의한 `/mcp` 엔드포인트에 `StreamableHTTPServerTransport` 라우트 |
| Non-streamable HTTP | NestJS 컨트롤러로 `POST /mcp` 단일 요청-응답 처리 (도구 호출만 지원, 서버 → 클라이언트 알림 없음) |

[ASSUMED — verify against Swagger SDK docs] non-streamable HTTP는 표준 MCP transport에 없는 사용자 정의이며,
본 서버에서는 단일 `tools/list` + `tools/call` JSON-RPC 요청만 처리하는 단순화된 형태로 정의한다.

---

## 9. 구현 시 검증해야 할 미해결 항목

| 항목 | 사유 | 해소 시점 |
|------|------|-----------|
| Swagger 정확한 파라미터 세부사항 | 본 조사 시점에 Swagger UI 직접 접근 불가(Cloudflare/세션) | RUN Phase 초입에 `data.go.kr` 인증 후 가이드 PDF 다운로드 |
| `detailPetTour2`의 KorService2 포함 여부 | 데이터고 카탈로그 본문에는 포함, 별도 API ID(15135102)도 존재 | RUN Phase 통합 테스트 시 200 응답 확인 |
| `searchKeyword2` 의 `keyword` 인코딩 정책 | 한글 키워드 EUC-KR 인코딩 요구 가능성 | RUN Phase 첫 통합 테스트 |
| MCP 비스트리밍 HTTP의 클라이언트 호환성 | 표준 transport 아님 | 차기 이터레이션에서 deprecate 검토 |

---

## 10. 외부 참고 자료

- 공공데이터포털 API 카탈로그: https://www.data.go.kr/data/15101578/openapi.do
- KTO 통합 API 안내(한국관광콘텐츠랩): https://api.visitkorea.or.kr/
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- MCP 사양: https://modelcontextprotocol.io/specification
- NestJS 11 공식 문서: https://docs.nestjs.com/
- `fast-xml-parser`: https://github.com/NaturalIntelligence/fast-xml-parser
- `class-validator`: https://github.com/typestack/class-validator

---

Version: 0.1.0
Last Updated: 2026-05-09
Author: Seonho Kim
