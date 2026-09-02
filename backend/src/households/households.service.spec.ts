import { BadRequestException } from '@nestjs/common';
import { HouseholdsService } from './households.service';

describe('HouseholdsService invite compatibility', () => {
  it('redeems a modern short household invite when legacy inviteCode lookup misses', async () => {
    const prisma = {
      household: { findUnique: jest.fn().mockResolvedValue(null) },
    } as any;
    const invites = {
      preview: jest.fn().mockResolvedValue({
        targetType: 'household',
        householdId: 'household-1',
      }),
      redeem: jest.fn().mockResolvedValue({ joined: true, householdId: 'household-1' }),
    } as any;
    const service = new HouseholdsService(prisma, invites);
    jest.spyOn(service, 'findById').mockResolvedValue({ id: 'household-1', name: 'Shared Home' } as any);

    const result = await service.join('user-2', { inviteCode: 'ABC12345' });

    expect(invites.preview).toHaveBeenCalledWith('user-2', 'ABC12345');
    expect(invites.redeem).toHaveBeenCalledWith('user-2', 'ABC12345');
    expect(result).toMatchObject({ id: 'household-1' });
  });

  it('does not redeem a Basket invite through the household join surface', async () => {
    const prisma = {
      household: { findUnique: jest.fn().mockResolvedValue(null) },
    } as any;
    const invites = {
      preview: jest.fn().mockResolvedValue({
        targetType: 'basket',
        basketId: 'basket-1',
      }),
      redeem: jest.fn(),
    } as any;
    const service = new HouseholdsService(prisma, invites);

    await expect(service.join('user-2', { inviteCode: 'BASK1234' })).rejects.toBeInstanceOf(BadRequestException);
    expect(invites.redeem).not.toHaveBeenCalled();
  });
});
