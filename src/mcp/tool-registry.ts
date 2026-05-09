import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { McpToolDefinition } from './types/mcp.types';
import type { KoreanTourInfoService } from '../kto/korean-tour-info/korean-tour-info.service';
import { KtoApiError, KtoValidationError } from '../kto/common/kto-error';
import { KOREAN_TOUR_INFO_TOOLS } from '../kto/korean-tour-info/korean-tour-info.tools';

// @MX:ANCHOR: [AUTO] 모든 MCP transport의 도구 등록 진입점
// @MX:REASON: 모든 transport 어댑터(stdio, http-streamable, http)가 이 함수를 호출한다. fan_in=3

/**
 * KOREAN_TOUR_INFO_TOOLS 배열을 순회하여 McpServer에 일괄 등록한다.
 * 각 도구 핸들러는 class-validator DTO 검증 → 서비스 메서드 호출 → 결과 직렬화 순서로 동작한다.
 */
export function registerAll(
  server: McpServer,
  service: KoreanTourInfoService,
): void {
  for (const tool of KOREAN_TOUR_INFO_TOOLS) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        // SDK는 Zod schema만 inputSchema로 허용한다.
        // DTO 검증은 핸들러 내부(handleToolCall)에서 class-validator로 수행한다.
      },
      async (args: Record<string, unknown>): Promise<CallToolResult> => {
        return handleToolCall(tool, service, args);
      },
    );
  }
}

/**
 * 단일 도구 호출을 처리한다: DTO 검증 → 서비스 호출 → 결과 반환.
 * 에러는 MCP 오류 응답으로 변환한다.
 */
async function handleToolCall(
  tool: McpToolDefinition,
  service: KoreanTourInfoService,
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
    const serviceMethod = (
      service as unknown as Record<string, (dto: unknown) => Promise<unknown>>
    )[tool.methodName];
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
