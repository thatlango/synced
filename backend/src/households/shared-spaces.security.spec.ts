import { ForbiddenException } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service';
import { BillsService } from '../bills/bills.service';
import { InvitesService } from '../invites/invites.service';
import { TransactionsService } from '../transactions/transactions.service';
import { HouseholdsService } from './households.service';

describe('Shared spaces security and money routing', () => {
  it('rejects household details for a non-member', async () => {
    const prisma = {
      householdMember: { findUnique: jest.fn().mockResolvedValue(null) },
      household: { findUnique: jest.fn() },
    } as any;
    const service = new HouseholdsService(prisma);

    await expect(service.findById('space-1', 'outsider')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.household.findUnique).not.toHaveBeenCalled();
  });

  it('rejects household analytics for a non-member', async () => {
    const prisma = {
      householdMember: { findUnique: jest.fn().mockResolvedValue(null) },
      wallet: { findUnique: jest.fn() },
    } as any;
    const service = new AnalyticsService(prisma);

    await expect(service.householdInsights('space-1', 'outsider')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.wallet.findUnique).not.toHaveBeenCalled();
  });

  it('does not allow walletId to bypass the caller accessible-wallet scope', async () => {
    const prisma = {
      wallet: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([{ id: 'personal-1' }])
          .mockResolvedValueOnce([{ id: 'shared-1' }]),
      },
    } as any;
    const service = new TransactionsService(prisma, { categorize: jest.fn() } as any);

    await expect(
      service.findAll('user-1', { scope: 'all', walletId: 'someone-elses-wallet' } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forces transactions posted to a household wallet to shared visibility', async () => {
    const transactionCreate = jest.fn().mockResolvedValue({ id: 'tx-1' });
    const ledgerCreate = jest.fn().mockResolvedValue({ id: 'ledger-1' });
    const walletUpdate = jest.fn().mockResolvedValue({ id: 'shared-wallet', balance: 75_000 });
    const prisma = {
      wallet: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'shared-wallet',
          type: 'household',
          householdId: 'space-1',
          userId: null,
          balance: 100_000,
        }),
      },
      transaction: { findUnique: jest.fn() },
      $transaction: jest.fn(async (callback: any) =>
        callback({
          transaction: { create: transactionCreate },
          wallet: { update: walletUpdate },
          ledgerEntry: { create: ledgerCreate, updateMany: jest.fn() },
        }),
      ),
    } as any;
    const service = new TransactionsService(
      prisma,
      { categorize: jest.fn().mockReturnValue('food') } as any,
    );

    await service.create('member-1', {
      walletId: 'shared-wallet',
      type: 'debit',
      amount: 25_000,
      category: 'food',
      description: 'Groceries',
      visibility: 'personal',
    } as any);

    expect(transactionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ visibility: 'household' }),
      }),
    );
    expect(ledgerCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ visibility: 'household' }),
      }),
    );
  });

  it('does not consume a finite invite when the redeemer is already a member', async () => {
    const inviteUpdate = jest.fn();
    const redemptionCreate = jest.fn();
    const prisma = {
      $transaction: jest.fn(async (callback: any) =>
        callback({
          invite: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'invite-1',
              code: 'ABC12345',
              status: 'active',
              targetType: 'household',
              householdId: 'space-1',
              basketId: null,
              useCount: 0,
              maxUses: 1,
              expiresAt: new Date(Date.now() + 86_400_000),
            }),
            update: inviteUpdate,
          },
          inviteRedemption: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: redemptionCreate,
          },
          householdMember: {
            findUnique: jest.fn().mockResolvedValue({ householdId: 'space-1', userId: 'member-1' }),
            create: jest.fn(),
          },
          basketMember: { findUnique: jest.fn(), create: jest.fn() },
          basket: { findUnique: jest.fn() },
        }),
      ),
    } as any;
    const service = new InvitesService(prisma);

    const result = await service.redeem('member-1', 'ABC12345');

    expect(result).toEqual(
      expect.objectContaining({ joined: true, duplicate: true, householdId: 'space-1' }),
    );
    expect(redemptionCreate).not.toHaveBeenCalled();
    expect(inviteUpdate).not.toHaveBeenCalled();
  });

  it('does not let a non-member mutate a shared-space bill', async () => {
    const prisma = {
      bill: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'bill-1',
          ownerType: 'household',
          householdId: 'space-1',
        }),
      },
      householdMember: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(),
    } as any;
    const service = new BillsService(prisma, { detect: jest.fn() } as any);

    await expect(service.markPaid('bill-1', 'outsider')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
