import {
  type CallHandler,
  type ExecutionContext,
  HttpException,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { type Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class ResponseWrapperInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
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
          status = 500;
          error = 'Internal Server Error';
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
