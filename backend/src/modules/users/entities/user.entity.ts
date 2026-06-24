import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password', type: 'varchar', length: 255 })
  password: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ name: 'phone', type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl: string;

  @Column({ name: 'role', type: 'enum', enum: ['super_admin', 'director', 'pmo', 'project_manager', 'team_lead', 'developer', 'qa', 'client'], default: 'developer' })
  role: string;

  @Column({ name: 'status', type: 'enum', enum: ['active', 'inactive', 'suspended', 'pending'], default: 'pending' })
  status: string;

  @Column({ name: 'department', type: 'varchar', length: 100, nullable: true })
  department: string;

  @Column({ name: 'position', type: 'varchar', length: 100, nullable: true })
  position: string;

  @Column({ name: 'timezone', type: 'varchar', length: 50, default: 'Asia/Jakarta' })
  timezone: string;

  @Column({ name: 'language', type: 'varchar', length: 10, default: 'id' })
  language: string;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'login_count', type: 'int', default: 0 })
  loginCount: number;

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
