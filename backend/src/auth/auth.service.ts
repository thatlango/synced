import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { SendOtpDto, VerifyOtpDto, SignUpDto, LoginDto } from './dto/auth.dto';
import { addMinutes, isAfter } from 'date-fns';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ─── OTP Generation ───────────────────────────────────────────

  private generateOtp(): string {
    // In production, use a crypto-secure random generator
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendOtp(phone: string, code: string): Promise<void> {
    const isMock = this.config.get<string>('OTP_MOCK', 'true') === 'true';
    if (isMock) {
      this.logger.log(`[MOCK OTP] Phone: ${phone} | Code: ${code}`);
      return;
    }
    // TODO: Integrate real SMS gateway
    this.logger.log(`Sending OTP to ${phone}`);
  }

  // ─── Send OTP ─────────────────────────────────────────────────

  async sendOtp(dto: SendOtpDto) {
    const code = this.generateOtp();
    const expiresAt = addMinutes(
      new Date(),
      this.config.get<number>('OTP_EXPIRY_MINUTES', 5),
    );

    // Invalidate any existing OTPs for this phone
    await this.prisma.otp.updateMany({
      where: { phone: dto.phone, usedAt: null },
      data: { usedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });

    await this.prisma.otp.create({
      data: {
        phone: dto.phone,
        code,
        expiresAt,
        userId: user?.id,
        purpose: user ? 'login' : 'signup',
      },
    });

    await this.sendOtp(dto.phone, code);

    return {
      message: 'OTP sent successfully',
      phone: dto.phone,
      // In dev mode, return the OTP for testing
      ...(this.config.get('OTP_MOCK') === 'true' && { otp: code, note: 'OTP included for demo mode only' }),
    };
  }

  // ─── Sign Up ──────────────────────────────────────────────────

  async signUp(dto: SignUpDto) {
    // Verify OTP
    await this.verifyOtpCode(dto.phone, dto.code, 'signup');

    // Check if user already exists
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) {
      throw new ConflictException('Phone number already registered. Please login.');
    }

    // Create user + personal wallet in a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          phone: dto.phone,
          name: dto.name,
          email: dto.email,
          platform: (dto.platform as any) || 'android',
          isVerified: true,
          lastLogin: new Date(),
        },
      });

      // Create personal wallet
      await tx.wallet.create({
        data: {
          type: 'personal',
          userId: newUser.id,
          balance: 0,
        },
      });

      return newUser;
    });

    const tokens = await this.generateTokens(user.id, user.phone);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─── Login ────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) {
      throw new UnauthorizedException('Phone number not registered. Please sign up.');
    }

    await this.verifyOtpCode(dto.phone, dto.code, 'login');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.phone);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private async verifyOtpCode(phone: string, code: string, purpose?: string) {
    const otp = await this.prisma.otp.findFirst({
      where: {
        phone,
        code,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new BadRequestException('Invalid OTP code');
    if (isAfter(new Date(), otp.expiresAt)) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });
  }

  private async generateTokens(userId: string, phone: string) {
    const payload = { sub: userId, phone };
    const accessToken = await this.jwt.signAsync(payload);
    return { accessToken };
  }

  private sanitizeUser(user: any) {
    const { ...safe } = user;
    return safe;
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        personalWallet: true,
        householdMembers: {
          include: {
            household: {
              include: {
                wallet: true,
                members: { include: { user: { select: { id: true, name: true, phone: true } } } },
              },
            },
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
