declare function require(name: string): unknown;
export {};

describe('authentication environment isolation', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('../src/config/environment');
    jest.dontMock('../src/services/api/auth.live.service');
    jest.dontMock('../src/services/api/auth.mock.service');
  });

  it('loads only live authentication in production', () => {
    let mockInitialized = false;
    jest.isolateModules(() => {
      jest.doMock('../src/config/environment', () => ({
        environment: { authMode: 'live' },
      }));
      jest.doMock('../src/services/api/auth.live.service', () => ({
        liveAuthService: { kind: 'live' },
      }));
      jest.doMock('../src/services/api/auth.mock.service', () => {
        mockInitialized = true;
        return { mockAuthService: { kind: 'mock' } };
      });
      const selected = require('../src/services/api/auth.service') as {
        authService: { kind: string };
      };
      expect(selected.authService.kind).toBe('live');
    });
    expect(mockInitialized).toBe(false);
  });

  it('loads mock authentication only when explicitly selected', () => {
    let liveInitialized = false;
    jest.isolateModules(() => {
      jest.doMock('../src/config/environment', () => ({
        environment: { authMode: 'mock' },
      }));
      jest.doMock('../src/services/api/auth.live.service', () => {
        liveInitialized = true;
        return { liveAuthService: { kind: 'live' } };
      });
      jest.doMock('../src/services/api/auth.mock.service', () => ({
        mockAuthService: { kind: 'mock' },
      }));
      const selected = require('../src/services/api/auth.service') as {
        authService: { kind: string };
      };
      expect(selected.authService.kind).toBe('mock');
    });
    expect(liveInitialized).toBe(false);
  });
});
