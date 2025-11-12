import { Injectable } from '@nestjs/common';
import { randomBytes, createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CsrfService {
  private readonly secret: string;

  constructor(private configService: ConfigService) {
    // Use a secret from environment or generate one
    this.secret = this.configService.get<string>('CSRF_SECRET') || this.generateSecret();
  }

  /**
   * Generate a random secret for HMAC signing
   */
  private generateSecret(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate a CSRF token
   * Uses Double Submit Cookie pattern with HMAC signing for added security
   */
  generateToken(): { token: string; cookie: string } {
    // Generate a random value
    const randomValue = randomBytes(32).toString('hex');

    // Create an HMAC of the random value with our secret
    const hmac = createHmac('sha256', this.secret);
    hmac.update(randomValue);
    const signature = hmac.digest('hex');

    // The token sent in the header will be: randomValue.signature
    const token = `${randomValue}.${signature}`;

    // The cookie will store just the random value
    const cookie = randomValue;

    return { token, cookie };
  }

  /**
   * Validate a CSRF token against the cookie value
   */
  validateToken(token: string, cookieValue: string): boolean {
    if (!token || !cookieValue) {
      return false;
    }

    try {
      // Token should be in format: randomValue.signature
      const parts = token.split('.');
      if (parts.length !== 2) {
        return false;
      }

      const [randomValue, signature] = parts;

      // Verify the random value matches the cookie
      if (randomValue !== cookieValue) {
        return false;
      }

      // Verify the signature
      const hmac = createHmac('sha256', this.secret);
      hmac.update(randomValue);
      const expectedSignature = hmac.digest('hex');

      // Use timing-safe comparison
      return this.timingSafeEqual(signature, expectedSignature);
    } catch (error) {
      return false;
    }
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}
