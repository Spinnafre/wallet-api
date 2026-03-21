import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Request, Response } from 'express';
import { Counter, Histogram } from 'prom-client';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly requestsCounter: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;

    const route = req.route as { path?: string } | undefined;
    const path = route?.path || req.url;

    const endTimer = this.requestDuration.startTimer({ method, path });

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          const status = String(res.statusCode);
          this.requestsCounter.inc({ method, path, status });
          endTimer({ status });
        },
        error: (err: unknown) => {
          let status = 500;

          if (err instanceof HttpException) {
            status = err.getStatus();
          } else if (err && typeof err === 'object') {
            const errorObj = err as Record<string, unknown>;
            status = Number(errorObj.status || errorObj.statusCode) || 500;
          }

          const statusStr = status.toString();
          this.requestsCounter.inc({ method, path, status: statusStr });
          endTimer({ status: statusStr });
        },
      }),
    );
  }
}
