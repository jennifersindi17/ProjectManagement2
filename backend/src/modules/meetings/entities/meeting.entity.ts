import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid', nullable: true }) projectId: string;
  @Column({ type: 'varchar', length: 255 }) title: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'varchar', length: 50, default: 'general' }) meetingType: string;
  @Column({ type: 'timestamptz' }) startTime: Date;
  @Column({ type: 'timestamptz', nullable: true }) endTime: Date;
  @Column({ type: 'varchar', length: 255, nullable: true }) location: string;
  @Column({ type: 'varchar', length: 500, nullable: true }) meetingLink: string;
  @Column({ type: 'uuid' }) organizerId: string;
  @Column({ type: 'varchar', length: 20, default: 'scheduled' }) status: string;
  @Column({ type: 'text', nullable: true }) minutes: string;
  @Column({ type: 'jsonb', default: '[]' }) actionItems: any;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
