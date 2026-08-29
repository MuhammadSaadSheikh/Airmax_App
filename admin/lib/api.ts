import { cookies } from 'next/headers';
import { resolveAirmaxApiUrl } from './config';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = (await cookies()).get('airmax_access')?.value;
  const response = await fetch(`${resolveAirmaxApiUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`AIRMAX API ${response.status}`);
  return response.json() as Promise<T>;
}
