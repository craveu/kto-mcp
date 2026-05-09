import { Test, TestingModule } from '@nestjs/testing';
import { McpService } from './mcp.service';

describe('McpService', () => {
  let service: McpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [McpService],
    }).compile();

    service = module.get<McpService>(McpService);
  });

  it('서비스가 정상적으로 인스턴스화되어야 한다', () => {
    expect(service).toBeDefined();
  });

  it('onModuleInit 호출 시 에러가 발생하지 않아야 한다', () => {
    expect(() => service.onModuleInit()).not.toThrow();
  });

  it('onModuleDestroy 호출 시 에러가 발생하지 않아야 한다', () => {
    expect(() => service.onModuleDestroy()).not.toThrow();
  });
});
