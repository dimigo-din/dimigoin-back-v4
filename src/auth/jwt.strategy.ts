import { HttpException, Injectable, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy, VerifiedCallback } from "passport-jwt";
import { Repository } from "typeorm";

import { Session } from "../schemas";

@Injectable()
export class CustomJwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_PRIVATE"),
      algorithms: ["RS256"],
    });
  }

  // TODO: 너무 느려지면 stateless로 갈거임. 난 세션이 좋아.'
  // 엄밀히 말하면 세션은 아닌디, 세션 + refresh 가능한 구조로 되어있음.
  // refresh token이 좀 오래 살아있어서 redis는 사용 안합니다.
  async validate(payload: any, done: VerifiedCallback): Promise<any> {
    if (!payload.refresh) {
      return done(null, payload);
    } else {
      throw new HttpException(
        "잘못된 토큰 형식입니다. Access Token을 전달해주세요.",
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
