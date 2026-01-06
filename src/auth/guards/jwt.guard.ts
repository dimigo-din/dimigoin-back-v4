import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { FastifyRequest } from "fastify";

@Injectable()
export class CustomJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest & {user?: unknown}>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractToken(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    if (type === "Bearer" && token) {
      return token;
    }

    if (request.cookies?.["access-token"]) {
      return request.cookies["access-token"];
    }

    return undefined;
  }
}
