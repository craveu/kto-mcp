# Project Interview

## Round 1: Vision
Question: 이 프로젝트의 목적과 사용자는?
Answer: 한국관광공사(KTO)가 data.go.kr를 통해 공개한 10개 공공 관광 API를 LLM 에이전트(Claude Desktop, Cursor, mcp-remote 클라이언트 등)가 자연어로 조회·활용할 수 있도록 래핑하는 MCP(Model Context Protocol) 서버. 주 사용자는 LLM 기반 여행 어시스턴트·컨텐츠 자동화 도구·연구 프로토타입을 만드는 개발자.

## Round 2: Technology
Question: 주요 기술 스택은?
Answer: NestJS 11 + TypeScript 5 (`module: nodenext`). MCP 표준 SDK는 `@modelcontextprotocol/sdk`. 전송(transport)은 stdio + Streamable HTTP + non-streamable HTTP **세 가지 모두** 지원. 테스트는 Jest, 패키지 매니저는 pnpm.

## Round 3: Scope
Question: 핵심 기능과 명시적 비범위는?
Answer:
- **이번 이터레이션 범위**: 첫 번째 API인 "한국관광공사 국문 관광정보 조회 API"(data.go.kr/data/15101578)만 MCP 도구로 노출. 해당 API의 전체 오퍼레이션 셋을 Swagger 문서 기준으로 매핑.
- **설계 고려**: 동일 오퍼레이션 셋을 가진 8개 다국어(eng/jpn/chs/cht/ger/fre/spn/rus) 변체 확장이 다음 이터레이션에 자연스럽게 들어올 수 있도록, 공용 KTO HTTP 클라이언트·DTO·MCP 도구 등록 레이어를 언어 파라미터화 가능한 구조로 설계.
- **로드맵 (다음 차례)**: 무장애 여행, 관광사진, 고캠핑, 오디오 가이드, 두루누비, 반려동물 동반여행, 의료관광, 웰니스관광, 관광공모전(사진) — 9개 추가 KTO API.
- **명시적 비범위**: 이번 차수에서는 다국어 8개 API 본격 구현 없음. 자체 데이터 캐시·DB 영속화 없음(추후 결정). 인증/멀티 테넌트 없음(서비스 키만 환경변수로 관리).
