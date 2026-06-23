import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('budget_entries')
export class BudgetEntry {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) projectId: string;
  @Column({ type: 'varchar', length: 100 }) category: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) plannedAmount: number;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) actualAmount: number;
  @Column({ type: 'date', default: () => 'CURRENT_DATE' }) date: Date;
  @Column({ type: 'varchar', length: 20 }) entryType: string;
  @Column({ type: 'uuid' }) createdBy: string;
  @Column({ type: 'uuid', nullable: true }) approvedBy: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
