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
          if (Array.isArray(error) && error.length > 1) {
            code = error[0];
            error = error[1];
          } else {
            error = error.message || error;
          }
        } else {
          status = 500;
          error = "Internal Server Error";
          console.log(err);
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
