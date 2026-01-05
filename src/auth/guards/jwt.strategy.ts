import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { FastifyRequest } from 'fastify';
import { ExtractJwt, Strategy, type VerifiedCallback } from 'passport-jwt';

const cookieExtractor = (req: FastifyRequest): string | null => {
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
      secretOrKey: configService.get<string>('JWT_PRIVATE') ?? 'secret',
      algorithms: ['RS256'],
    });
  }

  async validate(payload: unknown, done: VerifiedCallback): Promise<unknown> {
    return done(null, payload);
  }
}
