import { HttpException, Injectable, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy, VerifiedCallback } from "passport-jwt";
import { Repository } from "typeorm";

import { Session } from "../schemas";

const cookieExtractor = (req: any): string | null => {
  const cookieHeader = req.cookies;
  if (cookieHeader && cookieHeader["access-token"]) {
    return cookieHeader["access-token"];
  }
  return null;
};

@Injectable()
export class CustomJwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_PRIVATE"),
      algorithms: ["RS256"],
    });
  }

  async validate(payload: any, done: VerifiedCallback): Promise<any> {
    return done(null, payload);
  }
}
