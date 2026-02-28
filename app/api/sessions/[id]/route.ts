import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithDetails, updateSession, deleteSession, initTursoDb } from '@/lib/db/turso';
import { sendSlackNotification } from '@/lib/slack';

let initialized = false;
async function ensureDb() {
  if (!initialized) {
    await initTursoDb();
    initialized = true;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDb();
    const session = await getSessionWithDetails(params.id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch (error) {
    console.error('GET /api/sessions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDb();
    const body = await request.json();
    const session = await updateSession(params.id, body);

    sendSlackNotification({
      type: 'session_updated',
      session,
      changes: body,
    }).catch(err => console.error('Slack notification error:', err));

    return NextResponse.json(session);
  } catch (error) {
    console.error('PATCH /api/sessions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDb();
    const session = await getSessionWithDetails(params.id);
    if (session) {
      await deleteSession(params.id);

      sendSlackNotification({
        type: 'session_deleted',
        session,
      }).catch(err => console.error('Slack notification error:', err));
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/sessions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
