import { NextRequest, NextResponse } from 'next/server';
import { getCharactersBySession, createCharacter, initTursoDb } from '@/lib/db/turso';

export async function GET(request: NextRequest) {
  try {
    await initTursoDb();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const characters = await getCharactersBySession(sessionId);
    return NextResponse.json(characters);
  } catch (error) {
    console.error('Failed to fetch characters:', error);
    return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initTursoDb();
    const data = await request.json();

    if (!data.sessionId || !data.name) {
      return NextResponse.json({ error: 'sessionId and name are required' }, { status: 400 });
    }

    const character = await createCharacter(data);
    return NextResponse.json(character);
  } catch (error) {
    console.error('Failed to create character:', error);
    return NextResponse.json({ error: 'Failed to create character' }, { status: 500 });
  }
}
