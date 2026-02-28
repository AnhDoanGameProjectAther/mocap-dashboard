import { NextRequest, NextResponse } from 'next/server';
import { getAllSessions, createSession, initTursoDb } from '@/lib/db/turso';
import { sendSlackNotification } from '@/lib/slack';

// Initialize database on first request
let initialized = false;
async function ensureDb() {
  if (!initialized) {
    await initTursoDb();
    initialized = true;
  }
}

export async function GET() {
  try {
    await ensureDb();
    const sessions = await getAllSessions();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('GET /api/sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const body = await request.json();
    console.log('Creating session:', body);

    const session = await createSession(body);
    console.log('Session created:', session);

    // Send Slack notification (don't await, let it run in background)
    sendSlackNotification({
      type: 'session_created',
      session,
    }).catch(err => console.error('Slack notification error:', err));

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('POST /api/sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to create session', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
