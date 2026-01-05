import { Injectable } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, type VerifiedCallback } from 'passport-jwt';

const cookieExtractor = (req: any): string | null => {
  const cookieHeader = req.cookies;
  if (cookieHeader?.['access-token']) {
    return cookieHeader['access-token'];
  }
  return null;
};

@Injectable()
export class CustomJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_PRIVATE')!,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any, done: VerifiedCallback): Promise<any> {
    return done(null, payload);
  }
}
