import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class CustomLoggerMiddleware implements NestMiddleware {
  private logger = new Logger(CustomLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const startTimestamp = Date.now();
    const requestMethod = req.method;
    const originURL = req.originalUrl;
    const httpVersion = `HTTP/${req.httpVersion}`;
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.socket.remoteAddress;
    const forwardedFor = Array.isArray(req.headers["x-forwarded-for"])
      ? req.headers["x-forwarded-for"].join(" > ")
      : (req.headers["x-forwarded-for"] || "").replaceAll(",", " > ");
    let authorization = "";
    if (
      (typeof req.headers["authorization"] === "string" &&
        req.headers["authorization"].startsWith("Bearer")) ||
      (req.cookies &&
        req.cookies["access-token"] &&
        typeof req.cookies["access-token"] === "string")
    ) {
      const authorizationTmp =
        (req.cookies ? req.cookies["access-token"] : null) ||
        req.headers["authorization"].replace("Bearer ", "");
      if (authorizationTmp.split(".").length === 3) {
        try {
          authorization = `${this.parseJwt(authorizationTmp).id}(${this.parseJwt(authorizationTmp).name})`;
        } catch (e) {
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
        `From ${forwardedFor ? `${forwardedFor} through ${ipAddress}` : ipAddress} (${userAgent}) - Requested "${requestMethod} ${originURL} ${httpVersion}" | Responded with HTTP ${statusCode} by uid{${authorization}} +${endTimestamp}ms `,
      );

      if (
        req.body &&
        Object.keys(req.body).length > 0 &&
        Buffer.byteLength(JSON.stringify(req.body), "utf8") < 1024 * 1024 && // 1mb
        req.path !== "/manage/user/renderHtml"
      )
        this.logger.log(`Request Body: ${JSON.stringify(req.body)}`);

      if (req.body && Buffer.byteLength(JSON.stringify(req.body), "utf8") > 1024 * 1024)
        this.logger.log("Request Body: [Too large to log]");
    });
    next();
  }

  parseJwt(token: string) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );

    return JSON.parse(jsonPayload);
  }
}
