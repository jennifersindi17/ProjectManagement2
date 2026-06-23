import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) userId: string;
  @Column({ type: 'enum', enum: ['task_assigned', 'task_updated', 'comment_added', 'mention', 'project_update', 'risk_alert', 'deadline_reminder', 'approval_request', 'system'] }) type: string;
  @Column({ type: 'varchar', length: 255 }) title: string;
  @Column({ type: 'text', nullable: true }) message: string;
  @Column({ type: 'varchar', length: 50, nullable: true }) referenceType: string;
  @Column({ type: 'uuid', nullable: true }) referenceId: string;
  @Column({ type: 'boolean', default: false }) isRead: boolean;
  @Column({ type: 'timestamptz', nullable: true }) readAt: Date;
  @Column({ type: 'varchar', length: 500, nullable: true }) actionUrl: string;
  @Column({ type: 'jsonb', default: {} }) metadata: any;
  @CreateDateColumn() createdAt: Date;
}
