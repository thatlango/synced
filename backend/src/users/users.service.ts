import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        personalWallet: true,
        householdMembers: {
          include: {
            household: { select: { id: true, name: true, inviteCode: true } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
    });
    return user;
  }

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        personalWallet: true,
        householdMembers: {
          include: {
            household: {
              include: {
                wallet: true,
                _count: { select: { members: true } },
              },
            },
          },
        },
        _count: {
          select: {
            transactions: true,
            subscriptions: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
