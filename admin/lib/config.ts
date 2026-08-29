type AdminEnvironment = Record<string, string | undefined>;

function isUnsafeProductionHostname(hostname: string): boolean {
  const normalized = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');
  const ipv4 = normalized.split('.').map(Number);
  const privateIpv4 =
    ipv4.length === 4 &&
    ipv4.every(part => Number.isInteger(part) && part >= 0 && part <= 255) &&
    (ipv4[0] === 10 ||
      (ipv4[0] === 172 && ipv4[1] >= 16 && ipv4[1] <= 31) ||
      (ipv4[0] === 192 && ipv4[1] === 168) ||
      (ipv4[0] === 169 && ipv4[1] === 254));
  return (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized === '0.0.0.0' ||
    normalized === '::1' ||
    (normalized.includes(':') &&
      (normalized.startsWith('fc') ||
        normalized.startsWith('fd') ||
        normalized.startsWith('fe80:'))) ||
    /^127(?:\.\d{1,3}){3}$/.test(normalized) ||
    privateIpv4 ||
    normalized === 'host.docker.internal'
  );
}

export function resolveAirmaxApiUrl(
  environment: AdminEnvironment = process.env,
): string {
  const configured = environment.AIRMAX_API_URL?.trim();
  if (!configured) throw new Error('AIRMAX_API_URL must be configured');

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error('AIRMAX_API_URL must be a valid absolute URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('AIRMAX_API_URL must use http:// or https://');
  }
  if (url.username || url.password) {
    throw new Error('AIRMAX_API_URL must not include credentials');
  }
  if (
    url.pathname.replace(/\/+$/, '') !== '/api/v1' ||
    url.search ||
    url.hash
  ) {
    throw new Error('AIRMAX_API_URL must target the /api/v1 prefix');
  }
  if (environment.NODE_ENV === 'production') {
    if (url.protocol !== 'https:') {
      throw new Error('AIRMAX_API_URL must use https:// in production');
    }
    if (isUnsafeProductionHostname(url.hostname)) {
      throw new Error(
        'AIRMAX_API_URL cannot target a local or private development host in production',
      );
    }
  }
  return configured.replace(/\/+$/, '');
}
