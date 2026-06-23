import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid', nullable: true }) userId: string;
  @Column({ type: 'enum', enum: ['create', 'update', 'delete', 'login', 'logout', 'export', 'import', 'approve', 'reject', 'assign', 'status_change'] }) action: string;
  @Column({ type: 'varchar', length: 50 }) entityType: string;
  @Column({ type: 'uuid', nullable: true }) entityId: string;
  @Column({ type: 'jsonb', nullable: true }) oldValues: any;
  @Column({ type: 'jsonb', nullable: true }) newValues: any;
  @Column({ type: 'inet', nullable: true }) ipAddress: string;
  @Column({ type: 'text', nullable: true }) userAgent: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) requestId: string;
  @Column({ type: 'jsonb', default: {} }) metadata: any;
  @CreateDateColumn() createdAt: Date;
}
