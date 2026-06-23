import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 20, unique: true }) code: string;
  @Column({ type: 'varchar', length: 255 }) name: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) clientName: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) clientContact: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) projectType: string;
  @Column({ type: 'enum', enum: ['planning', 'analysis', 'development', 'sit', 'uat', 'go_live', 'support', 'closed', 'on_hold', 'cancelled'], default: 'planning' }) status: string;
  @Column({ type: 'enum', enum: ['critical', 'high', 'medium', 'low'], default: 'medium' }) priority: string;
  @Column({ type: 'enum', enum: ['green', 'yellow', 'red'], default: 'green' }) health: string;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) contractValue: number;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) budget: number;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) actualCost: number;
  @Column({ type: 'date', nullable: true }) startDate: Date;
  @Column({ type: 'date', nullable: true }) endDate: Date;
  @Column({ type: 'date', nullable: true }) actualStartDate: Date;
  @Column({ type: 'date', nullable: true }) actualEndDate: Date;
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 }) completionPercentage: number;
  @Column({ type: 'uuid', nullable: true }) projectManagerId: string;
  @Column({ type: 'uuid' }) createdBy: string;
  @Column({ type: 'varchar', length: 500, nullable: true }) coverImageUrl: string;
  @Column({ type: 'jsonb', default: {} }) metadata: any;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt: Date;
}
