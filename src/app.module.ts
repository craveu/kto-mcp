import { Module } from '@nestjs/common';
import { McpModule } from './mcp/mcp.module';
import { KtoModule } from './kto/kto.module';
import { KoreanTourInfoModule } from './kto/korean-tour-info/korean-tour-info.module';

@Module({
  imports: [McpModule, KtoModule, KoreanTourInfoModule],
})
export class AppModule {}
