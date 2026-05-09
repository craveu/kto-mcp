import { Module } from '@nestjs/common';
import { KtoHttpClient } from './kto-http.client';

/**
 * KTO API 통합 모듈.
 * KtoHttpClient를 제공하며 하위 모듈에 export한다.
 * SPEC-KTO-011: KtoHttpClient가 stateless로 전환되어 생성자에서 키를 받지 않는다.
 */
@Module({
  providers: [KtoHttpClient],
  exports: [KtoHttpClient],
})
export class KtoModule {}
