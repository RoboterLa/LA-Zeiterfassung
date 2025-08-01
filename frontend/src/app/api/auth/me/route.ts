import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Prüfe Session beim Backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
    const response = await fetch(`${backendUrl}/api/auth/me`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (response.ok) {
      const userData = await response.json();
      return NextResponse.json(userData);
    } else {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 });
  }
} 