import { InvitesService } from './invites.service';

describe('InvitesService share transport', () => {
  const householdId = 'household-1';
  const userId = 'user-1';

  it('returns a normal HTTPS share link while keeping the QR deep link app-native', async () => {
    const prisma = {
      householdMember: {
        findUnique: jest.fn().mockResolvedValue({ householdId, userId, role: 'admin' }),
      },
      invite: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(async ({ data }) => ({
          id: 'invite-1',
          ...data,
          useCount: 0,
          status: 'active',
        })),
      },
    } as any;

    const service = new InvitesService(prisma);
    const invite = await service.create(userId, {
      targetType: 'household',
      householdId,
      role: 'member',
    });

    expect(invite.joinUrl).toBe(
      `https://api.synced.tukutuku.org/api/v1/invites/open/${invite.code}`,
    );
    expect(invite.qrPayload).toBe(`synced://join?code=${invite.code}`);
  });
});
