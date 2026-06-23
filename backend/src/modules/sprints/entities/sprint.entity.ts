import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('sprints')
export class Sprint {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) projectId: string;
  @Column({ type: 'varchar', length: 100 }) name: string;
  @Column({ type: 'text', nullable: true }) goal: string;
  @Column({ type: 'enum', enum: ['planning', 'active', 'completed', 'cancelled'], default: 'planning' }) status: string;
  @Column({ type: 'date' }) startDate: Date;
  @Column({ type: 'date' }) endDate: Date;
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 }) totalStoryPoints: number;
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 }) completedStoryPoints: number;
  @Column({ type: 'uuid' }) createdBy: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
