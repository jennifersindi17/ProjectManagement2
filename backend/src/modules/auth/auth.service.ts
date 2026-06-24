import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepo.findOne({ where: { email, deletedAt: null } });
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.password);
    return valid ? user : null;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Invalid email or password');
    if (user.status !== 'active') throw new UnauthorizedException('Account is not active');
    const tokens = await this.generateTokens(user);
    await this.usersRepo.update(user.id, { lastLoginAt: new Date() } as any);
    return { ...tokens, user: this.sanitize(user) };
  }

  async register(dto: RegisterDto, createdBy?: string) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already registered');
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      ...dto,
      password: hashedPassword,
      status: 'active',
      emailVerifiedAt: new Date(),
      ...(createdBy && { createdBy }),
    } as any);
    const saved = await this.usersRepo.save(user) as any;
    return this.sanitize(saved);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET') || 'refresh-secret',
      });
      const user = await this.usersRepo.findOne({ where: { id: payload.sub, deletedAt: null, status: 'active' } });
      if (!user) throw new UnauthorizedException('Invalid token');
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    return { message: 'Logged out' };
  }

  async getProfile(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId, deletedAt: null } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.sanitize(user);
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET') || 'refresh-secret',
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '30d',
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private sanitize(user: User) {
    const { password, ...rest } = user as any;
    return rest;
  }
}
