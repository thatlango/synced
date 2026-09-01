import { AuthService } from './auth.service';

describe('AuthService Core SSO exchange', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('exchanges a PKCE code and maps the canonical Core identity to a Synced session', async () => {
    const prisma: any = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'synced-user-1',
          coreUserId: 'core-user-1',
          email: 'qa@example.com',
          phone: null,
          name: 'Release QA',
          isVerified: true,
        }),
        update: jest.fn(),
      },
    };
    const jwt: any = { signAsync: jest.fn().mockResolvedValue('synced-access-token') };
    const config: any = {
      get: jest.fn((key: string, fallback?: unknown) => {
        if (key === 'TUKU_CORE_API_URL') return 'https://core.tukutuku.org';
        if (key === 'TUKU_CORE_SYNCED_CLIENT_ID') return 'synced-android';
        return fallback;
      }),
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          authenticated: true,
          identity: {
            coreUserId: 'core-user-1',
            email: 'qa@example.com',
            emailVerified: true,
          },
        },
      }),
    } as any);

    const service = new AuthService(prisma, jwt, config);
    const result = await service.coreExchange({
      code: 'one-time-code',
      codeVerifier: 'v'.repeat(64),
      redirectUri: 'synced://auth/tuku/callback',
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://core.tukutuku.org/api/v1/sso/exchange');
    expect(JSON.parse(init.body)).toEqual({
      clientId: 'synced-android',
      code: 'one-time-code',
      redirectUri: 'synced://auth/tuku/callback',
      codeVerifier: 'v'.repeat(64),
    });
    expect(prisma.user.create).toHaveBeenCalled();
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'synced-user-1', phone: undefined });
    expect(result.accessToken).toBe('synced-access-token');
    expect(result.canonicalIdentity).toEqual({ coreUserId: 'core-user-1' });
    expect((result as any).coreAccessToken).toBeUndefined();
  });

  it('verifies a native Core bearer token without receiving the user password', async () => {
    const prisma: any = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'synced-user-native',
          coreUserId: 'core-user-native',
          email: 'native@example.com',
          phone: null,
          name: 'Native User',
          isVerified: true,
        }),
        update: jest.fn(),
      },
    };
    const jwt: any = { signAsync: jest.fn().mockResolvedValue('synced-native-token') };
    const config: any = {
      get: jest.fn((key: string, fallback?: unknown) =>
        key === 'TUKU_CORE_API_URL' ? 'https://core.tukutuku.org' : fallback),
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { profile: { coreUserId: 'core-user-native', email: 'native@example.com', displayName: 'Native User' }, identities: [] } }),
    } as any);

    const service = new AuthService(prisma, jwt, config);
    const result = await service.coreSession({ accessToken: 'core-short-lived-token' });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://core.tukutuku.org/api/v1/auth/me');
    expect(init.method).toBe('GET');
    expect(init.headers.authorization).toBe('Bearer core-short-lived-token');
    expect(JSON.stringify(init)).not.toContain('password');
    expect(result.accessToken).toBe('synced-native-token');
    expect((result as any).coreAccessToken).toBeUndefined();
  });

});
