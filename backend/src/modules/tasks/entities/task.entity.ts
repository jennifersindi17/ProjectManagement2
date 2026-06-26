import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) projectId: string;
  @Column({ type: 'uuid', nullable: true }) sprintId: string;
  @Column({ type: 'uuid', nullable: true }) parentTaskId: string;
  @Column({ type: 'varchar', length: 20 }) taskCode: string;
  @Column({ type: 'varchar', length: 255 }) title: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'enum', enum: ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked', 'cancelled', 'analysis', 'development', 'sit', 'uat', 'go_live'], default: 'backlog' }) status: string;
  @Column({ type: 'enum', enum: ['critical', 'high', 'medium', 'low'], default: 'medium' }) priority: string;
  @Column({ type: 'enum', enum: ['feature', 'bug', 'improvement', 'task', 'epic', 'story', 'subtask', 'milestone'], default: 'task' }) taskType: string;
  @Column({ type: 'uuid', nullable: true }) assigneeId: string;
  @Column({ type: 'uuid' }) reporterId: string;
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true }) storyPoints: number;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) estimatedHours: number;
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 }) actualHours: number;
  @Column({ type: 'date', nullable: true }) dueDate: Date;
  @Column({ type: 'date', nullable: true }) startDate: Date;
  @Column({ type: 'timestamptz', nullable: true }) completedAt: Date;
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 }) completionPercentage: number;
  @Column({ type: 'int', default: 0 }) position: number;
  @Column({ type: 'text', array: true, default: {} }) labels: string[];
  @Column({ type: 'jsonb', default: {} }) metadata: any;
  @Column({ type: 'simple-array', nullable: true }) dependsOn: string[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt: Date;
}
