import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) projectId: string;
  @Column({ type: 'varchar', length: 20 }) issueCode: string;
  @Column({ type: 'varchar', length: 255 }) title: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'enum', enum: ['open', 'in_progress', 'investigation', 'fixed', 'closed', 'reopened'], default: 'open' }) status: string;
  @Column({ type: 'enum', enum: ['critical', 'major', 'minor', 'trivial'], default: 'minor' }) severity: string;
  @Column({ type: 'varchar', length: 50, nullable: true }) category: string;
  @Column({ type: 'uuid', nullable: true }) assigneeId: string;
  @Column({ type: 'uuid' }) reporterId: string;
  @Column({ type: 'text', nullable: true }) resolution: string;
  @Column({ type: 'date', nullable: true }) dueDate: Date;
  @Column({ type: 'timestamptz', nullable: true }) resolvedAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) closedAt: Date;
  @Column({ type: 'jsonb', default: {} }) metadata: any;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
