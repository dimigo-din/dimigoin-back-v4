import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { CacheService } from '../../common/modules/cache.module';

@Injectable()
export class PersonalInformationVerifyTokenStrategy extends PassportStrategy(
  Strategy,
  'personalInformationVerifyToken',
) {
  constructor(private readonly cacheService: CacheService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('token'),
      ignoreExpiration: false,
      secretOrKeyProvider: async (
        _req,
        _rawJwtToken,
        done: (err: any, secret?: string) => void,
      ) => {
        try {
          const secret = await this.cacheService.getPersonalInformationVerifyTokenSecret();
          done(null, secret);
        } catch (err) {
          done(err);
        }
      },
      algorithms: ['HS512'],
    });
  }

  async validate(payload: any) {
    return payload;
  }
}
