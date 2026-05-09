import { Module } from '@nestjs/common';
import { KtoHttpClient } from './kto-http.client';
import { getEnv } from '../env';

/**
 * KTO API 통합 모듈.
 * KtoHttpClient를 제공하며 하위 모듈에 export한다.
 */
@Module({
  providers: [
    {
      provide: KtoHttpClient,
      useFactory: () => {
        const env = getEnv();
        return new KtoHttpClient(
          env.ktoServiceKey,
          env.ktoServiceKeyPreencoded,
        );
      },
    },
  ],
  exports: [KtoHttpClient],
})
export class KtoModule {}
