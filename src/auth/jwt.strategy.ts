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
  async validate(payload: any, done: VerifiedCallback): Promise<any> {
    if (!payload.refresh) {
      const session = await this.sessionRepository.findOne({
        where: { sessionIdentifier: payload.sessionIdentifier },
      });
      if (!session) {
        throw new HttpException("세션이 만료되었습니다.", HttpStatus.UNAUTHORIZED);
      }
      return done(null, payload);
    } else {
      throw new HttpException(
        "잘못된 토큰 형식입니다. Access Token을 전달해주세요.",
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
