import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

/**
 * MCP 서버 라이프사이클 관리 서비스.
 * Phase 4에서 실제 McpServer 연결 로직이 추가된다.
 */
@Injectable()
export class McpService implements OnModuleInit, OnModuleDestroy {
  onModuleInit(): void {
    // Phase 4에서 MCP 서버 초기화 로직 추가
  }

  onModuleDestroy(): void {
    // Phase 4에서 MCP 서버 종료 로직 추가
  }
}
