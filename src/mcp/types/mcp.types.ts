// MCP 도구 메타데이터 및 핸들러 관련 공용 타입 정의

/** JSON Schema 객체 표현 (간소화) */
export interface JsonSchema {
  type: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

/** JSON Schema 개별 프로퍼티 */
export interface JsonSchemaProperty {
  type?: string | string[];
  description?: string;
  minimum?: number;
  maximum?: number;
  enum?: (string | number)[];
  format?: string;
}

/** MCP 도구 핸들러 함수 시그니처 */
export type McpToolHandler = (
  params: Record<string, unknown>,
) => Promise<unknown>;

/** MCP 도구 정의 메타데이터 */
export interface McpToolDefinition {
  /** 도구 이름 (예: kto_korean_areaBasedList2) */
  name: string;
  /** 도구 설명 (한국어 가능) */
  description: string;
  /** 입력 JSON Schema */
  inputSchema: JsonSchema;
  /** 연결된 DTO 클래스 (class-validator 검증용) */
  dtoClass: new () => object;
  /** 서비스 메서드명 */
  methodName: string;
}
