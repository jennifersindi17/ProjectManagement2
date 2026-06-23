import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('change_requests')
export class ChangeRequest {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) projectId: string;
  @Column({ type: 'varchar', length: 20 }) crCode: string;
  @Column({ type: 'varchar', length: 255 }) title: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'text', nullable: true }) justification: string;
  @Column({ type: 'text', nullable: true }) impactAnalysis: string;
  @Column({ type: 'enum', enum: ['draft', 'review', 'approved', 'rejected', 'in_development', 'testing', 'deployed', 'closed'], default: 'draft' }) status: string;
  @Column({ type: 'uuid' }) requestedBy: string;
  @Column({ type: 'uuid', nullable: true }) reviewedBy: string;
  @Column({ type: 'uuid', nullable: true }) approvedBy: string;
  @Column({ type: 'timestamptz', nullable: true }) approvedAt: Date;
  @Column({ type: 'text', nullable: true }) rejectedReason: string;
  @Column({ type: 'enum', enum: ['critical', 'high', 'medium', 'low'], default: 'medium' }) priority: string;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) estimatedCost: number;
  @Column({ type: 'date', nullable: true }) targetDate: Date;
  @Column({ type: 'timestamptz', nullable: true }) completedAt: Date;
  @Column({ type: 'jsonb', default: {} }) metadata: any;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
