/**
 * KTO 관광지 오디오 가이드정보 모듈 (Odii 서비스).
 * KTO B551011/Odii API의 8개 오퍼레이션을 AudioGuideService로 제공한다.
 *
 * @MX:NOTE: [AUTO] Odii — KTO 4번째 다국어 패턴(단일 path + langCode 파라미터).
 * BASE_URL_MAP.Odii = 'http://apis.data.go.kr/B551011/Odii'
 * @MX:SPEC: SPEC-KTO-005 REQ-KTO5-001
 */
import { Module } from '@nestjs/common';
import { KtoModule } from '../kto.module';
import { AudioGuideService } from './audio-guide.service';

@Module({
  imports: [KtoModule],
  providers: [AudioGuideService],
  exports: [AudioGuideService],
})
export class AudioGuideModule {}
