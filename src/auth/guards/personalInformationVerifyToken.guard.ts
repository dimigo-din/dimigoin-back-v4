import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { FastifyRequest } from "fastify";
import { CacheService } from "$modules/cache.module";

@Injectable()
export class PersonalInformationVerifyTokenAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest & { user?: unknown }>();
    const body = request.body as { token?: string } | undefined;
    const token = body?.token;

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const secret = await this.cacheService.getPersonalInformationVerifyTokenSecret();
      const payload = await this.jwtService.verifyAsync(token, {
        secret,
        algorithms: ["HS512"],
      });
      request.user = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}
