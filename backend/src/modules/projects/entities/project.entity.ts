import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'code', type: 'varchar', length: 20, unique: true }) code: string;

  @Column({ name: 'name', type: 'varchar', length: 255 }) name: string;

  @Column({ name: 'description', type: 'text', nullable: true }) description: string;

  @Column({ name: 'client_name', type: 'varchar', length: 255, nullable: true }) clientName: string;

  @Column({ name: 'client_contact', type: 'varchar', length: 255, nullable: true }) clientContact: string;

  @Column({ name: 'project_type', type: 'varchar', length: 100, nullable: true }) projectType: string;

  @Column({ name: 'status', type: 'enum', enum: ['planning', 'analysis', 'development', 'sit', 'uat', 'go_live', 'support', 'closed', 'on_hold', 'cancelled'], default: 'planning' }) status: string;

  @Column({ name: 'priority', type: 'enum', enum: ['critical', 'high', 'medium', 'low'], default: 'medium' }) priority: string;

  @Column({ name: 'health', type: 'enum', enum: ['green', 'yellow', 'red'], default: 'green' }) health: string;

  @Column({ name: 'contract_value', type: 'decimal', precision: 15, scale: 2, default: 0 }) contractValue: number;

  @Column({ name: 'budget', type: 'decimal', precision: 15, scale: 2, default: 0 }) budget: number;

  @Column({ name: 'actual_cost', type: 'decimal', precision: 15, scale: 2, default: 0 }) actualCost: number;

  @Column({ name: 'start_date', type: 'date', nullable: true }) startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true }) endDate: Date;

  @Column({ name: 'actual_start_date', type: 'date', nullable: true }) actualStartDate: Date;

  @Column({ name: 'actual_end_date', type: 'date', nullable: true }) actualEndDate: Date;

  @Column({ name: 'completion_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 }) completionPercentage: number;

  @Column({ name: 'project_manager_id', type: 'uuid', nullable: true }) projectManagerId: string;

  @Column({ name: 'target_go_live', type: 'date', nullable: true }) targetGoLive: Date;

  @Column({ name: 'client_pic', type: 'varchar', length: 255, nullable: true }) clientPic: string;

  @Column({ name: 'project_sponsor', type: 'varchar', length: 255, nullable: true }) projectSponsor: string;

  @Column({ name: 'delivery_manager', type: 'varchar', length: 255, nullable: true }) deliveryManager: string;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'IDR' }) currency: string;

  @Column({ name: 'category', type: 'varchar', length: 100, nullable: true }) category: string;

  @Column({ name: 'tags', type: 'jsonb', default: [] }) tags: string[];

  @Column({ name: 'labels_jsonb', type: 'jsonb', default: [] }) labelsJsonb: string[];

  // Virtual getter for labels (alias)
  get labels(): string[] { return this.labelsJsonb || []; }

  @Column({ name: 'notes', type: 'text', nullable: true }) notes: string;

  @Column({ name: 'created_by', type: 'uuid' }) createdBy: string;

  @Column({ name: 'cover_image_url', type: 'varchar', length: 500, nullable: true }) coverImageUrl: string;

  @Column({ name: 'metadata', type: 'jsonb', default: {} }) metadata: any;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date;
}
