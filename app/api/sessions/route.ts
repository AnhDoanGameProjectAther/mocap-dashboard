import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { getAllSessions, createSession } from '@/lib/db/operations';
import { sendSlackNotification } from '@/lib/slack';

// Initialize database on first request
let initialized = false;
function ensureDb() {
  if (!initialized) {
    initDb();
    initialized = true;
  }
}

export async function GET() {
  ensureDb();
  try {
    const sessions = getAllSessions();
    return NextResponse.json(sessions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  ensureDb();
  try {
    const body = await request.json();
    const session = createSession(body);

    // Send Slack notification
    await sendSlackNotification({
      type: 'session_created',
      session,
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
