# 제품 문서 (Product)

## 프로젝트 정보

**프로젝트명**: kto-mcp  
**한 줄 설명**: 한국관광공사(KTO) 10개 공공 API를 LLM 에이전트가 자연어로 활용할 수 있는 MCP 서버 (10/10 완성)

---

## 타겟 사용자

1. **LLM 에이전트 개발자**
   - Claude Desktop, Cursor 등의 LLM 클라이언트에 MCP 도구를 로드하는 개발자
   - LLM이 API 응답을 자동으로 해석하고 추가 쿼리를 구성할 수 있도록 하려는 사람

2. **여행 어시스턴트 빌더**
   - 한국 관광 정보를 포함한 AI 챗봇/어시스턴트를 구축하는 개발자
   - 실시간 관광 정보(숙박, 관광지, 축제 등)가 필요한 제품

3. **연구 프로토타입 개발자**
   - 공공 API를 활용한 프로토타입이나 데이터 분석이 필요한 연구자

---

## 핵심 기능

### 1. MCP 도구 노출 (63개 도구)
- data.go.kr의 KTO 10개 공개 API를 **63개 MCP 도구(Tools)로 표준화**
- LLM이 자연어 의도에 따라 적절한 도구를 선택하여 호출
- 모든 도구 정의에 명확한 매개변수·설명 포함
- **10개 API**: 국문 관광정보(13), 무장애 여행(10), 관광사진(4), 고캠핑(5), 오디오 가이드(8), 두루누비(2), 반려동물 동반(4), 의료관광(7), 웰니스관광(8), 관광공모전(2)

### 2. 유연한 전송(Transport) 지원
- **stdio**: 로컬 개발 및 Claude Desktop 통합
- **Streamable HTTP**: 대용량 응답의 점진적 스트리밍 지원
- **Non-Streamable HTTP**: 간단한 요청-응답 구조 필요 시

### 3. KTO API 래핑 및 정규화
- data.go.kr에 공개된 10개 KTO API를 표준화된 인터페이스로 제공
- XML/JSON 응답을 파싱하여 일관된 JSON 형식 반환
- 서비스 키 관리 및 인증 처리 자동화
- 지수 백오프 재시도 정책 (3회, base 500ms)

### 4. 다국어 처리 패턴 완벽 흡수
- **7가지 KTO 다국어 패턴** 모두 구현:
  - V2 별도 path (KorService2/EngService2 등 9개)
  - V2 sibling 단독 (KorWithService2, KorPetTourService2)
  - V1 단독 (PhotoGalleryService1)
  - suffix 없음 평면형 (GoCamping, Durunubi)
  - langCode 파라미터 (Odii)
  - langDivCd 파라미터 + lang fluid (MdclTursmService, WellnessTursmService)
  - 응답 필드 prefix ko*/en* (PhokoAwrdService)

---

## 구현 범위 (10/10 완성)

### 통합 완료 10개 API
1. **SPEC-KTO-001**: 국문 관광정보 조회 (KorService2) — 13개 도구 (v1.1.0)
2. **SPEC-KTO-002**: 무장애 여행정보 (KorWithService2) — 10개 도구
3. **SPEC-KTO-003**: 관광사진 정보 (PhotoGalleryService1) — 4개 도구
4. **SPEC-KTO-004**: 고캠핑 정보 (GoCamping) — 5개 도구
5. **SPEC-KTO-005**: 오디오 가이드 (Odii) — 8개 도구
6. **SPEC-KTO-006**: 두루누비 (Durunubi) — 2개 도구
7. **SPEC-KTO-007**: 반려동물 동반 여행 (KorPetTourService2) — 4개 도구
8. **SPEC-KTO-008**: 의료관광 (MdclTursmService) — 7개 도구
9. **SPEC-KTO-009**: 웰니스관광 (WellnessTursmService) — 8개 도구
10. **SPEC-KTO-010**: 관광공모전 (PhokoAwrdService) — 2개 도구

### 품질 검증
- Jest 단위 테스트: 693개 (모두 통과)
- e2e 테스트: 30개 (모두 통과)
- 커버리지: 89% statements, 92% lines (목표 85% 달성)
- 실 키 스모크 검증: 모든 10개 API 통과
- ESLint: 0 errors, 0 warnings

---

## 향후 로드맵

### 3차 이터레이션 계획 (가능성)
- KTO 외 다른 한국 공공 API 통합 고려 (관광지식정보시스템, 문화재청 등)
- 별도 서비스 아키텍처 검토

### 성능 최적화
- 응답 캐싱 (Redis/메모리 캐시) 도입
- API 응답 인덱싱 및 풀텍스트 검색
- 로깅·모니터링·분석 인프라

---

## 명시적 비범위

### 현재 미포함
- **영속 저장소(DB)**: 관광 정보 캐싱용 DB 없음. 서비스 운영 단계에서 필요 시 도입
- **인증/인가**: 멀티 테넌트, 사용자 관리 없음. KTO 서비스 키는 환경변수로 관리만 수행
- **MCP 클라이언트 인증**: API 키, OAuth2 기반 인증 미구현
- **다국어 변체 path 별도 모듈화**: SPEC-KTO-001의 8개 다국어 변체(영, 일, 중 간체, 중 번체, 독일, 프랑스, 스페인, 러시아) path는 현재 미노출. 7가지 패턴 흡수로 충분한 확장성 확보됨

---

## 성공 기준 (10/10 마일스톤)

| 기준 | 상태 | 결과 |
|------|------|------|
| API 통합 완성도 | 10/10 완성 | 63개 도구 노출 |
| 테스트 커버리지 | 목표 85% | 89% statements, 92% lines |
| 테스트 성공율 | 723개 총 | 693 unit + 30 e2e 모두 통과 |
| 문서 완성도 | 완성 | 10개 SPEC (v1.0.0), README, 프로젝트 문서 |
| 빌드 성공율 | 100% | dist/ 생성 성공 |
| 린트 에러율 | 0% | ESLint 0 errors, 0 warnings |
| 실 키 스모크 | 통과 | 모든 10개 API 실 호출 검증 |

---

Version: 2.0.0  
Last Updated: 2026-05-09  
Owner: seonho@wantedlab.com
Status: 10/10 완성, 운영 단계
