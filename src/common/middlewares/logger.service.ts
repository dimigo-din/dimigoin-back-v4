import { Injectable, Logger, type NestMiddleware } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

@Injectable()
export class CustomLoggerMiddleware implements NestMiddleware {
  private logger = new Logger(CustomLoggerMiddleware.name);

  use(req: FastifyRequest, res: FastifyReply["raw"], next: () => void) {
    const startTimestamp = Date.now();
    const reqMethod = req.method;
    const originURL = req.url;
    const httpVersion = `HTTP/${req.raw.httpVersion}`;
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.socket?.remoteAddress;
    const forwardedFor = Array.isArray(req.headers["x-forwarded-for"])
      ? req.headers["x-forwarded-for"].join(" > ")
      : (req.headers["x-forwarded-for"] || "").replace(/,/g, " > ");

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
          authorization = `${this.parseJwt(authorizationTmp).id}(${this.parseJwt(authorizationTmp).name})`;
        } catch (_e) {
          authorization = "unknown";
        }
      }
    } else {
      authorization = "unknown";
    }

    res.on("finish", () => {
      const statusCode = res.statusCode;
      const endTimestamp = Date.now() - startTimestamp;

      this.logger.log(
        `From ${forwardedFor ? `${forwardedFor} through ${ipAddress}` : ipAddress} (${userAgent}) - Requested "${reqMethod} ${originURL} ${httpVersion}" | Responded with HTTP ${statusCode} by uid{${authorization}} +${endTimestamp}ms `,
      );
    });

    if (
      req.body &&
      Object.keys(req.body).length > 0 &&
      Buffer.byteLength(JSON.stringify(req.body), "utf8") < 1024 * 1024 && // 1mb
      originURL !== "/manage/user/renderHtml"
    ) {
      this.logger.log(`Request Body: ${JSON.stringify(req.body)}`);
    }

    if (req.body && Buffer.byteLength(JSON.stringify(req.body), "utf8") > 1024 * 1024) {
      this.logger.log("Request Body: [Too large to log]");
    }

    next();
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

  parseJwt(token: string) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(""),
    );

    return JSON.parse(jsonPayload);
  }
}
