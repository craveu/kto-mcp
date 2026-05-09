import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { McpToolDefinition } from './types/mcp.types';
import { KtoApiError, KtoValidationError } from '../kto/common/kto-error';

interface JsonSchemaField {
  type?: string;
  description?: string;
  enum?: string[];
  minimum?: number;
}

interface JsonSchemaObject {
  type?: string;
  properties?: Record<string, JsonSchemaField>;
  required?: string[];
}

// JSON Schema(이 프로젝트가 KOREAN_TOUR_INFO_TOOLS에 보유한 형태)를
// MCP SDK가 요구하는 ZodRawShape로 변환한다. SDK가 inputSchema를 받지 않으면
// 핸들러 첫 인자가 RequestHandlerExtra(AbortSignal 등)가 되어
// class-transformer가 "Illegal constructor"를 던진다.
function jsonSchemaToZodShape(
  schema: JsonSchemaObject | undefined,
): Record<string, z.ZodTypeAny> {
  if (!schema || schema.type !== 'object' || !schema.properties) {
    return {};
  }
  const required = new Set(schema.required ?? []);
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [name, field] of Object.entries(schema.properties)) {
    let z_: z.ZodTypeAny;
    if (field.type === 'string') {
      z_ =
        field.enum && field.enum.length > 0
          ? z.enum(field.enum as [string, ...string[]])
          : z.string();
    } else if (field.type === 'number' || field.type === 'integer') {
      let n = z.number();
      if (field.type === 'integer') n = n.int();
      if (typeof field.minimum === 'number') n = n.min(field.minimum);
      z_ = n;
    } else {
      z_ = z.unknown();
    }
    if (field.description) z_ = z_.describe(field.description);
    if (!required.has(name)) z_ = z_.optional();
    shape[name] = z_;
  }
  return shape;
}

/** 도구 레지스트리 항목: 도구 정의 배열과 해당 서비스 객체를 묶는다 */
export interface ToolRegistry {
  tools: McpToolDefinition[];
  service: object;
}

// @MX:ANCHOR: [AUTO] 모든 MCP transport의 도구 등록 진입점
// @MX:REASON: 모든 transport 어댑터(stdio, http-streamable, http)가 이 함수를 호출한다. fan_in=3.
// 복수 레지스트리(KorService2 15개 + KorWithService2 10개 등)를 지원하도록 일반화됨.

/**
 * 복수의 도구 레지스트리를 순회하여 McpServer에 일괄 등록한다.
 * 각 도구 핸들러는 class-validator DTO 검증 → 서비스 메서드 호출 → 결과 직렬화 순서로 동작한다.
 *
 * @example
 * registerAll(server, [
 *   { tools: KOREAN_TOUR_INFO_TOOLS, service: koreanTourInfoService },
 *   { tools: BARRIER_FREE_TOUR_INFO_TOOLS, service: barrierFreeTourInfoService },
 * ]);
 */
export function registerAll(
  server: McpServer,
  registries: ToolRegistry[],
): void {
  for (const { tools, service } of registries) {
    for (const tool of tools) {
      const inputShape = jsonSchemaToZodShape(
        tool.inputSchema as JsonSchemaObject | undefined,
      );
      server.registerTool(
        tool.name,
        {
          description: tool.description,
          // ZodRawShape를 넘겨야 SDK가 클라이언트 args를 핸들러 1번 인자로 전달한다.
          // class-validator로 한 번 더 강한 검증을 handleToolCall 내부에서 수행한다.
          inputSchema: inputShape,
        },
        async (args: Record<string, unknown>): Promise<CallToolResult> => {
          return handleToolCall(
            tool,
            service as Record<string, (dto: unknown) => Promise<unknown>>,
            args,
          );
        },
      );
    }
  }
}

/**
 * 단일 도구 호출을 처리한다: DTO 검증 → 서비스 호출 → 결과 반환.
 * 에러는 MCP 오류 응답으로 변환한다.
 */
async function handleToolCall(
  tool: McpToolDefinition,
  service: Record<string, (dto: unknown) => Promise<unknown>>,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  // DTO 검증
  const dto = plainToInstance(tool.dtoClass, args);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: false,
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const fields = errors.map((e) => e.property);
    const messages = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('; ');
    const validationError = new KtoValidationError(
      `입력 검증 실패: [${fields.join(', ')}] — ${messages}`,
      fields,
    );
    return buildErrorResult(validationError.message);
  }

  // 서비스 메서드 호출
  try {
    const serviceMethod = service[tool.methodName];
    const result: unknown = await serviceMethod.call(service, dto);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    };
  } catch (err) {
    if (err instanceof KtoApiError) {
      const message = JSON.stringify({
        code: err.code,
        resultMsg: err.resultMsg,
        httpStatus: err.httpStatus,
        permanent: err.permanent,
      });
      return buildErrorResult(message);
    }
    if (err instanceof KtoValidationError) {
      return buildErrorResult(err.message);
    }
    const message = err instanceof Error ? err.message : String(err);
    return buildErrorResult(message);
  }
}

function buildErrorResult(message: string): CallToolResult {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
  };
}
