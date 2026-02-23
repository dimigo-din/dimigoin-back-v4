import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable()
export class ResponseWrapperInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const res = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();
    const logger = request?.logger;
    const shouldTransformToSnakeCase = !this.isAuthRoute(request?.url);

    return next.handle().pipe(
      map((data) => {
        return {
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          data: shouldTransformToSnakeCase ? this.toSnakeCaseDeep(data) : data,
        };
      }),
      catchError((err) => {
        let status: number;
        let error: unknown;
        let code: unknown;

        if (err instanceof HttpException) {
          status = err.getStatus();
          error = err.getResponse();
          if (Array.isArray(error) && error.length > 1) {
            code = error[0];
            error = error[1];
          } else {
            error = (error as Error).message || error;
          }
        } else {
          logger?.error?.(err);
          status = 500;
          error = "Internal Server Error";
        }

        res.status(status);
        return of({
          ok: false,
          status: status,
          error: error,
          code,
        });
      }),
    );
  }

  private isAuthRoute(url: unknown): boolean {
    if (typeof url !== "string") {
      return false;
    }
    const path = url.split("?")[0];
    return path === "/auth" || path.startsWith("/auth/");
  }

  private toSnakeCaseDeep<T>(value: T): T {
    if (value === null || value === undefined) {
      return value;
    }

    if (
      typeof value !== "object" ||
      value instanceof Date ||
      value instanceof RegExp ||
      value instanceof Error
    ) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.toSnakeCaseDeep(item)) as T;
    }

    if (value instanceof Map) {
      return new Map(
        Array.from(value.entries()).map(([key, item]) => [
          typeof key === "string" ? this.toSnakeCase(key) : key,
          this.toSnakeCaseDeep(item),
        ]),
      ) as T;
    }

    if (value instanceof Set) {
      return new Set(Array.from(value.values()).map((item) => this.toSnakeCaseDeep(item))) as T;
    }

    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[this.toSnakeCase(key)] = this.toSnakeCaseDeep(item);
    }
    return out as T;
  }

  private toSnakeCase(key: string): string {
    return key
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/-/g, "_")
      .toLowerCase();
  }
}
