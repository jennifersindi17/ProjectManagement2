import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('timesheets')
export class Timesheet {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) userId: string;
  @Column({ type: 'uuid' }) projectId: string;
  @Column({ type: 'uuid', nullable: true }) taskId: string;
  @Column({ type: 'date' }) date: Date;
  @Column({ type: 'decimal', precision: 5, scale: 2 }) hours: number;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) activityType: string;
  @Column({ type: 'enum', enum: ['draft', 'submitted', 'approved', 'rejected'], default: 'draft' }) status: string;
  @Column({ type: 'uuid', nullable: true }) approvedBy: string;
  @Column({ type: 'timestamptz', nullable: true }) approvedAt: Date;
  @Column({ type: 'text', nullable: true }) rejectionReason: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
