import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import JwksRsa from 'jwks-rsa';

@Injectable()
export class AppCheckGuard implements CanActivate {
  private readonly logger = new Logger(AppCheckGuard.name);
  private readonly jwksClient: JwksRsa.JwksClient;
  private readonly projectNumber: string;

  constructor(private readonly configService: ConfigService) {
    this.projectNumber = this.configService.get<string>('FIREBASE_PROJECT_NUMBER');

    this.jwksClient = JwksRsa({
      jwksUri: 'https://firebaseappcheck.googleapis.com/v1/jwks',
      cache: true,
      cacheMaxAge: 86400000,
      rateLimit: true,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.NODE_ENV === 'dev') {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const appCheckToken = request.headers['x-firebase-appcheck'];

    if (!appCheckToken) {
      throw new UnauthorizedException('App Check token required');
    }

    try {
      await this.verifyToken(appCheckToken);
      return true;
    } catch (error) {
      this.logger.warn(`App Check verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid App Check token');
    }
  }

  private async verifyToken(token: string): Promise<void> {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header.kid) {
      throw new Error('Invalid token format');
    }

    const key = await this.jwksClient.getSigningKey(decoded.header.kid);
    const publicKey = key.getPublicKey();

    const payload = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: `https://firebaseappcheck.googleapis.com/${this.projectNumber}`,
      audience: `projects/${this.projectNumber}`,
    }) as jwt.JwtPayload;

    if (!payload.sub) {
      throw new Error('Missing subject claim');
    }
  }
}