import { Module } from '@nestjs/common';
import { McpService } from './mcp.service';
import { StdioTransportAdapter } from './transports/stdio.adapter';
import { HttpStreamableTransportAdapter } from './transports/http-streamable.adapter';
import { HttpTransportAdapter } from './transports/http.adapter';
import { SessionCredentialsStore } from './session-credentials.store';
import { KoreanTourInfoModule } from '../kto/korean-tour-info/korean-tour-info.module';

@Module({
  imports: [KoreanTourInfoModule],
  providers: [
    McpService,
    SessionCredentialsStore,
    StdioTransportAdapter,
    HttpStreamableTransportAdapter,
    HttpTransportAdapter,
  ],
  exports: [
    McpService,
    SessionCredentialsStore,
    StdioTransportAdapter,
    HttpStreamableTransportAdapter,
    HttpTransportAdapter,
  ],
})
export class McpModule {}
