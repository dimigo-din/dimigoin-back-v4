import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

@Injectable()
export class CustomLoggerMiddleware implements NestMiddleware {
  private logger = new Logger(CustomLoggerMiddleware.name);

  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    const startTimestamp = Date.now();
    const request = req as any;
    const requestMethod = request.method;
    const originURL = request.url;
    const httpVersion = `HTTP/${request.httpVersion}`;
    const userAgent = request.headers['user-agent'];
    const ipAddress = request.socket?.remoteAddress;
    const forwardedFor = Array.isArray(request.headers['x-forwarded-for'])
      ? request.headers['x-forwarded-for'].join(' > ')
      : (request.headers['x-forwarded-for'] || '').replace(/,/g, ' > ');

    let authorization = '';
    const cookies = this.parseCookies(request.headers.cookie || '');

    if (
      (typeof request.headers.authorization === 'string' &&
        request.headers.authorization.startsWith('Bearer')) ||
      cookies?.['access-token']
    ) {
      const authorizationTmp =
        cookies['access-token'] || request.headers.authorization?.replace('Bearer ', '');
      if (authorizationTmp && authorizationTmp.split('.').length === 3) {
        try {
          authorization = `${this.parseJwt(authorizationTmp).id}(${this.parseJwt(authorizationTmp).name})`;
        } catch (_e) {
          authorization = 'unknown';
        }
      }
    } else {
      authorization = 'unknown';
    }

    res.on('finish', () => {
      const statusCode = res.statusCode;
      const endTimestamp = Date.now() - startTimestamp;

      this.logger.log(
        `From ${forwardedFor ? `${forwardedFor} through ${ipAddress}` : ipAddress} (${userAgent}) - Requested "${requestMethod} ${originURL} ${httpVersion}" | Responded with HTTP ${statusCode} by uid{${authorization}} +${endTimestamp}ms `,
      );
    });

    next();
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) {
      return cookies;
    }

    cookieHeader.split(';').forEach((cookie) => {
      const [name, ...rest] = cookie.split('=');
      if (name && rest.length) {
        cookies[name.trim()] = rest.join('=').trim();
      }
    });

    return cookies;
  }

  parseJwt(token: string) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(''),
    );

    return JSON.parse(jsonPayload);
  }
}
