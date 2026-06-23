import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) projectId: string;
  @Column({ type: 'varchar', length: 255 }) name: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'enum', enum: ['contract', 'brd', 'fsd', 'sit', 'uat', 'mom', 'training_material', 'report', 'other'], default: 'other' }) category: string;
  @Column({ type: 'enum', enum: ['draft', 'review', 'approved', 'archived'], default: 'draft' }) status: string;
  @Column({ type: 'varchar', length: 500 }) fileUrl: string;
  @Column({ type: 'varchar', length: 255 }) fileName: string;
  @Column({ type: 'bigint', nullable: true }) fileSize: number;
  @Column({ type: 'varchar', length: 100, nullable: true }) fileType: string;
  @Column({ type: 'varchar', length: 20, default: '1.0' }) version: string;
  @Column({ type: 'uuid' }) uploadedBy: string;
  @Column({ type: 'uuid', nullable: true }) approvedBy: string;
  @Column({ type: 'timestamptz', nullable: true }) approvedAt: Date;
  @Column({ type: 'text', array: true, default: {} }) tags: string[];
  @Column({ type: 'jsonb', default: {} }) metadata: any;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt: Date;
}
