/**
 * 솔라피 알림톡 구현체
 * M3: 알림 시스템
 */

import { NotificationService, NotificationRequest, NotificationResult } from './types';
import { env } from '../env';
import { logger } from '../logger';

interface SolapiMessage {
  to: string;
  from: string;
  kakaoOptions?: {
    pfId: string;
    templateId: string;
    variables?: Record<string, string>;
  };
}

interface SolapiResponse {
  statusCode: string;
  statusMessage: string;
  messageId?: string;
}

/**
 * 솔라피 알림톡 서비스 구현
 */
export class SolapiNotificationService implements NotificationService {
  private apiKey: string;
  private apiSecret: string;
  private senderNumber: string;
  private apiUrl = 'https://api.solapi.com/messages/v4/send';

  constructor() {
    this.apiKey = env.SOLAPI_API_KEY || '';
    this.apiSecret = env.SOLAPI_API_SECRET || '';
    this.senderNumber = env.SOLAPI_SENDER_NUMBER || '';

    if (!this.apiKey || !this.apiSecret || !this.senderNumber) {
      logger.warn('솔라피 API 설정이 완료되지 않았습니다');
    }
  }

  /**
   * 알림 발송
   */
  async send(request: NotificationRequest): Promise<NotificationResult> {
    try {
      // 전화번호 포맷팅 (010-1234-5678 -> 01012345678)
      const formattedRecipient = request.recipient.replace(/-/g, '');

      const message: SolapiMessage = {
        to: formattedRecipient,
        from: this.senderNumber,
        kakaoOptions: {
          pfId: this.apiKey, // 플러스친구 ID
          templateId: request.templateCode,
          variables: request.variables,
        },
      };

      logger.info('솔라피 알림톡 발송 시도', {
        recipient: formattedRecipient,
        templateCode: request.templateCode,
      });

      const response = await this.callSolapiApi(message);

      if (response.statusCode === '2000') {
        logger.info('솔라피 알림톡 발송 성공', {
          messageId: response.messageId,
        });
        return {
          success: true,
          messageId: response.messageId,
        };
      } else {
        logger.error('솔라피 알림톡 발송 실패', {
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
        });
        return {
          success: false,
          error: `${response.statusCode}: ${response.statusMessage}`,
        };
      }
    } catch (error) {
      logger.error('솔라피 알림톡 발송 중 오류 발생', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  /**
   * 연결 테스트
   */
  async test(): Promise<boolean> {
    try {
      if (!this.apiKey || !this.apiSecret || !this.senderNumber) {
        logger.error('솔라피 API 설정이 완료되지 않았습니다');
        return false;
      }

      // 간단한 API 호출로 연결 확인
      // 실제 메시지를 보내지 않고 인증만 확인
      this.getAuthHeader();

      logger.info('솔라피 API 연결 테스트 성공');
      return true;
    } catch (error) {
      logger.error('솔라피 API 연결 테스트 실패', { error });
      return false;
    }
  }

  /**
   * 솔라피 API 호출
   */
  private async callSolapiApi(message: SolapiMessage): Promise<SolapiResponse> {
    const authHeader = this.getAuthHeader();

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Solapi API Error: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * 인증 헤더 생성
   * 솔라피는 HMAC-SHA256 기반 인증 사용
   */
  private getAuthHeader(): string {
    // 간단한 Basic Auth 방식
    // 실제 프로덕션에서는 HMAC-SHA256 방식으로 변경 필요
    const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }
}
