import { Injectable, Logger } from '@nestjs/common';

interface AuditLogMetadata {
  [key: string]: boolean | number | string | undefined;
}

interface AuditLogEntry {
  action: string;
  email?: string;
  metadata?: AuditLogMetadata;
  outcome: 'failure' | 'success';
  userId?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger('Audit');

  record(entry: AuditLogEntry) {
    const payload = {
      action: entry.action,
      email: entry.email ? this.maskEmail(entry.email) : undefined,
      metadata:
        entry.metadata && Object.keys(entry.metadata).length > 0 ? entry.metadata : undefined,
      outcome: entry.outcome,
      timestamp: new Date().toISOString(),
      userId: entry.userId,
    };
    const line = JSON.stringify(payload);

    if (entry.outcome === 'failure') {
      this.logger.warn(line);
      return;
    }

    this.logger.log(line);
  }

  private maskEmail(email: string) {
    const [localPart, domain] = email.split('@');

    if (!localPart || !domain) {
      return '***';
    }

    if (localPart.length === 1) {
      return `*@${domain}`;
    }

    const visiblePrefix = localPart.slice(0, Math.min(2, localPart.length));

    return `${visiblePrefix}***@${domain}`;
  }
}
