import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { Observable } from "rxjs";

@Injectable()
export class CustomLoggerInterceptor implements NestInterceptor {
  private logger = new Logger(CustomLoggerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<FastifyRequest>();
    const res = ctx.getResponse<FastifyReply>();

    if (req.url === "/health") {
      return next.handle();
    }

    const startTimestamp = Date.now();
    const reqMethod = req.method;
    const originURL = req.url;
    const httpVersion = `HTTP/${req.raw.httpVersion}`;
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.socket?.remoteAddress;
    const forwardedForHeader = req.headers["x-forwarded-for"];
    const forwardedFor = Array.isArray(forwardedForHeader)
      ? forwardedForHeader.join(" > ")
      : (forwardedForHeader || "").replace(/,/g, " > ");

    let authorization = "";
    const cookies = this.parseCookies(req.headers.cookie || "");

    if (
      (typeof req.headers.authorization === "string" &&
        req.headers.authorization.startsWith("Bearer")) ||
      cookies?.["access-token"]
    ) {
      const authorizationTmp =
        cookies["access-token"] || req.headers.authorization?.replace("Bearer ", "");
      if (authorizationTmp && authorizationTmp.split(".").length === 3) {
        try {
          const jwt = this.parseJwt(authorizationTmp);
          authorization = `${jwt.id}(${jwt.name})`;
        } catch (_e) {
          authorization = "unknown";
        }
      }
    } else {
      authorization = "unknown";
    }

    if (req.body && Object.keys(req.body as object).length > 0) {
      try {
        const stringifiedBody = JSON.stringify(req.body);
        if (Buffer.byteLength(stringifiedBody, "utf8") < 1024 * 1024) {
          this.logger.log(`Request Body: ${stringifiedBody}`);
        } else {
          this.logger.log("Request Body: [Too large to log]");
        }
      } catch (_e) {
        this.logger.error("Could not stringify request body");
      }
    }

    res.raw.on("finish", () => {
      const statusCode = res.raw.statusCode;
      const endTimestamp = Date.now() - startTimestamp;

      this.logger.log(
        `From ${
          forwardedFor ? `${forwardedFor} through ${ipAddress}` : ipAddress
        } (${userAgent}) - Requested "${reqMethod} ${originURL} ${httpVersion}" | Responded with HTTP ${statusCode} by uid{${authorization}} +${endTimestamp}ms `,
      );
    });

    return next.handle();
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) {
      return cookies;
    }

    cookieHeader.split(";").forEach((cookie) => {
      const [name, ...rest] = cookie.split("=");
      if (name && rest.length) {
        cookies[name.trim()] = rest.join("=").trim();
      }
    });

    return cookies;
  }

  private parseJwt(token: string) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url?.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64 ?? "", "base64").toString("utf-8");

    return JSON.parse(jsonPayload);
  }
}
