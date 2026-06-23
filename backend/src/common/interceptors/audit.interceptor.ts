import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const { method, url, user, body } = request;
    const auditActions = ['POST', 'PUT', 'PATCH', 'DELETE'];

    if (auditActions.includes(method)) {
      const action = this.getAuditAction(method);
      const entityType = this.getEntityType(url);

      this.logger.log(
        `[AUDIT] ${action} ${entityType} by user ${user?.id || 'anonymous'} - ${method} ${url}`,
      );

      // TODO: Persist audit log to audit_logs table via AuditService
      // Example: await this.auditService.log({ action, entityType, userId: user?.id, changes: body });
    }

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `[AUDIT] Response sent for ${method} ${url} - Status: ${response.statusCode}`,
        );
      }),
    );
  }

  private getAuditAction(method: string): string {
    const actionMap: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return actionMap[method] || 'UNKNOWN';
  }

  private getEntityType(url: string): string {
    const segments = url.split('/').filter(Boolean);
    // Remove 'api' prefix if present
    if (segments[0] === 'api') {
      segments.shift();
    }
    return segments[0] || 'unknown';
  }
}
