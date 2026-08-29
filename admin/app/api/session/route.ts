import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { resolveAirmaxApiUrl } from '@/lib/config';

export async function POST(request: Request) {
  const body = await request.json();
  const response = await fetch(`${resolveAirmaxApiUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const session = await response.json();
  (await cookies()).set('airmax_access', session.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 900,
    path: '/',
  });
  return NextResponse.json({ user: session.user });
}
