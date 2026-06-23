import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('risks')
export class Risk {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) projectId: string;
  @Column({ type: 'varchar', length: 20 }) riskCode: string;
  @Column({ type: 'varchar', length: 255 }) title: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'int' }) probability: number;
  @Column({ type: 'int' }) impact: number;
  @Column({ type: 'enum', enum: ['very_low', 'low', 'medium', 'high', 'very_high'], default: 'medium' }) riskLevel: string;
  @Column({ type: 'enum', enum: ['identified', 'assessed', 'mitigated', 'monitoring', 'closed', 'occurred'], default: 'identified' }) status: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) category: string;
  @Column({ type: 'text', nullable: true }) mitigationPlan: string;
  @Column({ type: 'text', nullable: true }) contingencyPlan: string;
  @Column({ type: 'uuid', nullable: true }) ownerId: string;
  @Column({ type: 'date', default: () => 'CURRENT_DATE' }) identifiedDate: Date;
  @Column({ type: 'date', nullable: true }) targetDate: Date;
  @Column({ type: 'timestamptz', nullable: true }) closedAt: Date;
  @Column({ type: 'jsonb', default: {} }) metadata: any;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
