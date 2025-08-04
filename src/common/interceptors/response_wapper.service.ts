import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
} from "@nestjs/common";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";

@Injectable()
export class ResponseWrapperInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        return {
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          data,
        };
      }),
      catchError((err) => {
        let status: number;
        let error: any;
        let code: any;

        if (err instanceof HttpException) {
          status = err.getStatus();
          error = err.getResponse();
        } else {
          status = 500;
          error = err.message || err;
          if (Array.isArray(err.message) && err.message.length > 1) {
            error = err.message[1];
            code = err.message[0];
          }
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
}
